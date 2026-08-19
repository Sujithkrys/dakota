import { generateAIReply } from "../src/lib/ai-reply";

async function run() {
  const reply = await generateAIReply({
    incomingMessage: "Hello",
    aiApiKey: "", // blank key
  });
  console.log("Reply:", reply);
}

run();
