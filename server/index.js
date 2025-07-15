const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, "rankings.json");

app.use(cors());
app.use(express.json());

// 랭킹 데이터 읽기
function readRankings() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// 랭킹 데이터 저장
function writeRankings(rankings) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(rankings, null, 2), "utf-8");
}

// 랭킹 조회
app.get("/api/rankings", (req, res) => {
  const rankings = readRankings();
  res.json(rankings);
});

// 랭킹 등록
app.post("/api/rankings", (req, res) => {
  const { nickname, country, score } = req.body;
  if (!nickname || !country || typeof score !== "number") {
    return res.status(400).json({ error: "닉네임, 국적, 점수 필수" });
  }
  let rankings = readRankings();
  rankings.push({ nickname, country, score });
  rankings = rankings.sort((a, b) => b.score - a.score).slice(0, 10); // 상위 10명만
  writeRankings(rankings);
  res.json({ success: true, rankings });
});

app.listen(PORT, () => {
  console.log(`Ranking server listening on http://localhost:${PORT}`);
});
