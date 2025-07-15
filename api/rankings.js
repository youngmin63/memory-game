const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { nickname, country, score } = req.body;
    if (!nickname || !country || typeof score !== "number") {
      return res.status(400).json({ error: "닉네임, 국적, 점수 필수" });
    }
    const { data, error } = await supabase
      .from("rankings")
      .insert([{ nickname, country, score }]);
    if (error) return res.status(500).json({ error: error.message });
    // 등록 후 상위 10명 반환
    const { data: top10, error: getError } = await supabase
      .from("rankings")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);
    if (getError) return res.status(500).json({ error: getError.message });
    return res.status(200).json({ success: true, rankings: top10 });
  }
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("rankings")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.status(405).json({ error: "Method not allowed" });
};
