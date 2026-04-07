import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const MODEL_NAME = "gemini-3-flash-preview";

export const createOrchestratorTools = (): FunctionDeclaration[] => [
  {
    name: "create_task",
    description: "Create a new task with an optional deadline.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "The title of the task.",
        },
        deadline: {
          type: Type.STRING,
          description: "The deadline for the task (e.g., 'tomorrow', 'next Friday').",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "get_tasks",
    description: "Retrieve all current tasks.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "schedule_event",
    description: "Schedule a calendar event at a specific date and time.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "The title of the event.",
        },
        datetime: {
          type: Type.STRING,
          description: "The date and time of the event (e.g., 'tomorrow at 5pm').",
        },
      },
      required: ["title", "datetime"],
    },
  },
  {
    name: "get_events",
    description: "Retrieve all scheduled events.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "save_note",
    description: "Save a note with the provided content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: {
          type: Type.STRING,
          description: "The content of the note to save.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "get_notes",
    description: "Retrieve all saved notes.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export const getGeminiResponse = async (
  apiKey: string,
  messages: any[],
  tools: any[]
) => {
  const ai = new GoogleGenAI({ apiKey });
  const config = {
    systemInstruction: `You are an AI Orchestrator Agent in a multi-agent productivity system.

Your job is to:
- Understand user intent
- Decide which tools to call
- Execute multi-step workflows by calling tools in sequence

You NEVER perform actions yourself. You MUST use tools.

---

AVAILABLE TOOLS:
- create_task
- get_tasks
- schedule_event
- get_events
- save_note
- get_notes

---

RULES:

1. If the user requests an action → CALL a tool
2. If multiple actions are required → CALL MULTIPLE TOOLS in order
3. Extract structured arguments from natural language
4. Be precise with dates and times
5. NEVER hallucinate tool responses

---

MULTI-STEP WORKFLOWS:

If user says:
"Schedule meeting and add note"

You MUST:
1. Call schedule_event
2. Call save_note

---

DAY PLANNING LOGIC:

If user says:
"Plan my day"

You MUST:
1. Call get_tasks
2. Call get_events
3. Wait for results
4. THEN generate a structured plan

---

DIRECT RESPONSE ONLY IF:
- No tool is needed

---

Assume today's date is ${new Date().toLocaleDateString()}.`,
    tools: [{ functionDeclarations: tools }],
  };
  
  return await ai.models.generateContent({
    model: MODEL_NAME,
    contents: messages,
    config,
  });
};
