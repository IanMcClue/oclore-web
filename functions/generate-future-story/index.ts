import { serve } from "http/server";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAIApi(new Configuration({ apiKey: openaiApiKey }));

interface WebhookPayload {
  record: {
    status: string;
    user_id: string;
    responses: string[];
  };
}

serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    if (record.status !== "verified") {
      return new Response(
        JSON.stringify({ message: "Ignored: status not verified" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: userData } = await supabase.auth.admin.getUser(record.user_id);
    const userName =
      userData?.user?.user_metadata?.full_name ||
      userData?.user?.user_metadata?.display_name ||
      "User";

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a creative writer crafting personalized, inspiring future stories.",
        },
        {
          role: "user",
          content: `Create a detailed story about ${userName}'s life in ${
            new Date().getFullYear() + 5
          }, using these responses: ${JSON.stringify(record.responses)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedStory = completion.data.choices[0].message?.content;

    const { error } = await supabase.rpc("save_story_and_update_status", {
      p_user_id: record.user_id,
      p_story: generatedStory,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Story generated and saved successfully" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
