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
  let rankings = readRankings();
  // 닉네임별 최고 점수만 남기기
  const bestByNickname = {};
  for (const r of rankings) {
    if (
      !bestByNickname[r.nickname] ||
      bestByNickname[r.nickname].score < r.score
    ) {
      bestByNickname[r.nickname] = r;
    }
  }
  // 점수 내림차순 정렬 후 상위 10개만 반환
  const uniqueRankings = Object.values(bestByNickname)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(uniqueRankings);
});

// 랭킹 등록
app.post("/api/rankings", (req, res) => {
  const { nickname, country, score } = req.body;
  if (!nickname || !country || typeof score !== "number") {
    return res.status(400).json({ error: "닉네임, 국적, 점수 필수" });
  }
  let rankings = readRankings();
  // 기존에 같은 닉네임이 있으면 더 높은 점수만 남김
  let updated = false;
  rankings = rankings.filter((r) => {
    if (r.nickname === nickname) {
      if (r.score < score) {
        // 기존 기록보다 높으면 기존 기록 제거
        return false;
      } else {
        // 기존 기록이 더 높거나 같으면 새 기록 무시
        updated = true;
        return true;
      }
    }
    return true;
  });
  if (!updated) {
    rankings.push({ nickname, country, score });
  }
  // 닉네임별 최고 점수만 남기고, 점수 내림차순 상위 10개만 저장
  const bestByNickname = {};
  for (const r of rankings) {
    if (
      !bestByNickname[r.nickname] ||
      bestByNickname[r.nickname].score < r.score
    ) {
      bestByNickname[r.nickname] = r;
    }
  }
  rankings = Object.values(bestByNickname)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  writeRankings(rankings);
  res.json({ success: true, rankings });
});

app.listen(PORT, () => {
  console.log(`Ranking server listening on http://localhost:${PORT}`);
});
