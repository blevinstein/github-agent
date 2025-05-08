import fetch from 'node-fetch';

const DEFAULT_MODEL = 'anthropic/claude-3.7-sonnet';

// TODO: Add context management
// TODO: Add cost calculation
export async function generateChatCompletion({
  messages,
  model = DEFAULT_MODEL,
  toolCallbacks = {},
  tools,
  temperature,
  toolChoice,
  mcpClient,
}) {
  const { OPENROUTER_API_KEY } = process.env;
  if (!OPENROUTER_API_KEY) throw new Error('Missing OPENROUTER_API_KEY in environment');

  if (mcpClient) {
    console.log('Derive tools and toolCallbacks from mcpClient')
    const mcpTools = await mcpClient.getAllTools();

    console.log(`${mcpTools.length} tools found`);

    // Convert MCP tools to OpenAI tool format
    tools = [
      ...(tools ?? []),
      ...mcpTools.map(({ name, description, inputSchema }) => ({
        type: 'function',
        function: {
          name,
          description,
          parameters: inputSchema,
        },
      })),
    ];

    toolCallbacks = {
      ...(toolCallbacks ?? {}),
      ...mcpTools.reduce((acc, tool) => {
        acc[tool.name] = async (args) => {
          return await mcpClient.callTool({ name: tool.name, arguments: args });
        };
        return acc;
      }, {}),
    }
  }

  let responseMessages = [];
  let finishReason;
  do {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        tools,
        messages: [ ...messages, ...responseMessages ],
        temperature,
        tool_choice: toolChoice,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    const newMessage = data.choices[0].message;
    finishReason = data.choices[0].finish_reason || (data.choices[0].finish_details && data.choices[0].finish_details.type);
    responseMessages.push(newMessage);
    if (finishReason === 'tool_calls') {
      for (let toolCall of newMessage.tool_calls) {
        if (!(toolCall.function.name in toolCallbacks)) {
          continue;
        }
        const args = JSON.parse(toolCall.function.arguments);
        const result = await toolCallbacks[toolCall.function.name](args);
        responseMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: typeof result === 'string' ? result : (JSON.stringify(result) || 'OK'),
        });
      }
    }
  } while (finishReason === 'length' || finishReason === 'tool_calls');

  return { responseMessages };
} 