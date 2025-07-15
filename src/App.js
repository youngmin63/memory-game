import React, { useState, useEffect } from "react";
import "./App.css";

function getRandomNumbers(count, min = 0, max = 99, exclude = []) {
  const arr = [];
  while (arr.length < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!arr.includes(n) && !exclude.includes(n)) arr.push(n);
  }
  return arr;
}

function shuffle(array) {
  return array
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map((v) => v[1]);
}

function App() {
  const [gameState, setGameState] = useState("ready"); // ready, show, input, result, over
  const [numbers, setNumbers] = useState([]); // 암기 숫자
  const [choices, setChoices] = useState([]); // 입력 단계 카드
  const [selected, setSelected] = useState([]); // 사용자가 선택한 숫자
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState({ nickname: "", country: "" });
  const [userInput, setUserInput] = useState({ nickname: "", country: "" });
  const [ranking, setRanking] = useState([]);
  // 언어 상태 추가
  const [lang, setLang] = useState("ko"); // "ko" 또는 "en"

  // 다국어 텍스트 매핑
  const TEXT = {
    ko: {
      nickname: "닉네임",
      selectCountry: "국적 선택",
      startGame: "게임 시작",
      round: "라운드",
      score: "점수",
      rankingBoard: "랭킹 보드",
      country: "국적",
      submit: "제출",
      clear: "지우기",
      correct: "정답! 다음 라운드로~",
      wrong: "오답! 게임 오버!",
      again: "다시 시작",
      memorize: "숫자를 외우세요!",
    },
    en: {
      nickname: "Nickname",
      selectCountry: "Select Country",
      startGame: "Start Game",
      round: "Round",
      score: "Score",
      rankingBoard: "Ranking Board",
      country: "Country",
      submit: "Submit",
      clear: "Clear",
      correct: "Correct! Next round~",
      wrong: "Wrong! Game Over!",
      again: "Restart",
      memorize: "Memorize the numbers!",
    },
  };

  // 국가 코드 -> 국가명(한글/영어) 매핑
  const COUNTRY_MAP = {
    KR: { ko: "대한민국", en: "Korea" },
    US: { ko: "미국", en: "USA" },
    JP: { ko: "일본", en: "Japan" },
    CN: { ko: "중국", en: "China" },
    FR: { ko: "프랑스", en: "France" },
    DE: { ko: "독일", en: "Germany" },
    IT: { ko: "이탈리아", en: "Italy" },
    GB: { ko: "영국", en: "UK" },
    CA: { ko: "캐나다", en: "Canada" },
    AU: { ko: "호주", en: "Australia" },
    ES: { ko: "스페인", en: "Spain" },
    NL: { ko: "네덜란드", en: "Netherlands" },
    SE: { ko: "스웨덴", en: "Sweden" },
    CH: { ko: "스위스", en: "Switzerland" },
    BE: { ko: "벨기에", en: "Belgium" },
    AT: { ko: "오스트리아", en: "Austria" },
    DK: { ko: "덴마크", en: "Denmark" },
    NO: { ko: "노르웨이", en: "Norway" },
    FI: { ko: "핀란드", en: "Finland" },
    NZ: { ko: "뉴질랜드", en: "New Zealand" },
    IE: { ko: "아일랜드", en: "Ireland" },
    ETC: { ko: "기타", en: "Other" },
  };

  // 라운드별 난이도 조정
  const memorizeCount = Math.min(3 + round - 1, 8); // 암기 숫자 개수 (최대 8)
  const choiceCount = memorizeCount + Math.min(6 + round - 1, 12); // 보기 카드 개수 (최대 20)
  const memorizeTime = Math.max(2000 - (round - 1) * 300, 1000); // 암기 시간(ms), 최소 1초

  // 게임 시작 전 입력 폼 유효성
  const canStart = userInput.nickname.trim() && userInput.country.trim();

  // 서버에서 랭킹 불러오기
  const fetchRanking = async () => {
    try {
      const res = await fetch("/api/rankings");
      const data = await res.json();
      setRanking(data);
    } catch (e) {
      setRanking([]);
    }
  };

  // 게임 시작/앱 시작 시 랭킹 불러오기
  useEffect(() => {
    fetchRanking();
  }, []);

  // 게임 오버 시 랭킹 등록 및 갱신
  useEffect(() => {
    if (gameState === "over" && user.nickname) {
      fetch("/api/rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: user.nickname,
          country: user.country,
          score,
        }),
      })
        .then((res) => res.json())
        .then((data) => setRanking(data.rankings || []))
        .catch(() => {});
    }
    // eslint-disable-next-line
  }, [gameState]);

  useEffect(() => {
    if (gameState === "show") {
      const timer = setTimeout(() => {
        // 입력 단계 진입 시 카드 생성
        let extra = getRandomNumbers(
          choiceCount - memorizeCount,
          0,
          99,
          numbers
        );
        let allChoices = [...numbers, ...extra];
        // 부족하면 중복 허용해서 랜덤 숫자 추가
        while (allChoices.length < choiceCount) {
          allChoices.push(Math.floor(Math.random() * 100));
        }
        setChoices(shuffle(allChoices));
        setSelected([]);
        setGameState("input");
      }, memorizeTime);
      return () => clearTimeout(timer);
    }
  }, [gameState, round, numbers, memorizeCount, choiceCount, memorizeTime]);

  const startGame = () => {
    setUser({ ...userInput });
    setRound(1);
    setScore(0);
    setMessage("");
    const nums = getRandomNumbers(3); // 1라운드는 3개 고정
    setNumbers(nums);
    setGameState("show");
    setSelected([]);
    setChoices([]);
  };

  const nextRound = () => {
    const nextRoundValue = round + 1;
    setRound(nextRoundValue);
    setScore((s) => s + 1);
    setMessage("정답! 다음 라운드로~");
    const nextMemorizeCount = Math.min(3 + nextRoundValue - 1, 8);
    const nums = getRandomNumbers(nextMemorizeCount);
    setNumbers(nums);
    setSelected([]);
    setChoices([]);
    setTimeout(() => {
      setMessage("");
      setGameState("show");
    }, 1000);
  };

  const checkAnswer = () => {
    const answer = numbers.join(",");
    if (selected.length === memorizeCount && selected.join(",") === answer) {
      nextRound();
    } else {
      setMessage("오답! 게임 오버!");
      setGameState("over");
    }
  };

  const handleCardSelect = (num) => {
    if (selected.length < memorizeCount && !selected.includes(num)) {
      setSelected((prev) => [...prev, num]);
    }
  };

  const handleClear = () => setSelected([]);

  return (
    <div className="App">
      <header className="App-header">
        {/* 언어 선택 드롭다운 */}
        <div style={{ width: "100%", textAlign: "right", marginBottom: 8 }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </div>
        <h1 style={{ fontSize: "2.1rem", marginBottom: 18 }}>
          숫자 Memory Rush
        </h1>
        <p
          style={{
            fontSize: "1.15rem",
            fontWeight: 900,
            margin: "0 0 18px 0",
            color: "#3b4cca",
          }}
        >
          {TEXT[lang].round}:{" "}
          <span style={{ fontSize: "1.2rem", color: "#e6b800" }}>{round}</span>{" "}
          / {TEXT[lang].score}:{" "}
          <span style={{ fontSize: "1.2rem", color: "#3b4cca" }}>{score}</span>
        </p>
        {/* 게임 시작 전 사용자 정보 입력 */}
        {gameState === "ready" && (
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <input
              type="text"
              placeholder={TEXT[lang].nickname}
              value={userInput.nickname}
              onChange={(e) =>
                setUserInput((u) => ({ ...u, nickname: e.target.value }))
              }
              style={{
                marginRight: 8,
                padding: "12px 18px",
                borderRadius: 10,
                fontSize: "1.05rem",
                minWidth: 100,
              }}
            />
            <select
              value={userInput.country}
              onChange={(e) =>
                setUserInput((u) => ({ ...u, country: e.target.value }))
              }
              style={{
                marginRight: 8,
                padding: "12px 18px",
                borderRadius: 10,
                fontSize: "1.05rem",
                minWidth: 100,
              }}
            >
              <option value="">{TEXT[lang].selectCountry}</option>
              <option value="KR">{COUNTRY_MAP.KR[lang]}</option>
              <option value="US">{COUNTRY_MAP.US[lang]}</option>
              <option value="JP">{COUNTRY_MAP.JP[lang]}</option>
              <option value="FR">{COUNTRY_MAP.FR[lang]}</option>
              <option value="DE">{COUNTRY_MAP.DE[lang]}</option>
              <option value="IT">{COUNTRY_MAP.IT[lang]}</option>
              <option value="GB">{COUNTRY_MAP.GB[lang]}</option>
              <option value="CA">{COUNTRY_MAP.CA[lang]}</option>
              <option value="AU">{COUNTRY_MAP.AU[lang]}</option>
              <option value="ES">{COUNTRY_MAP.ES[lang]}</option>
              <option value="NL">{COUNTRY_MAP.NL[lang]}</option>
              <option value="SE">{COUNTRY_MAP.SE[lang]}</option>
              <option value="CH">{COUNTRY_MAP.CH[lang]}</option>
              <option value="BE">{COUNTRY_MAP.BE[lang]}</option>
              <option value="AT">{COUNTRY_MAP.AT[lang]}</option>
              <option value="DK">{COUNTRY_MAP.DK[lang]}</option>
              <option value="NO">{COUNTRY_MAP.NO[lang]}</option>
              <option value="FI">{COUNTRY_MAP.FI[lang]}</option>
              <option value="NZ">{COUNTRY_MAP.NZ[lang]}</option>
              <option value="IE">{COUNTRY_MAP.IE[lang]}</option>
              <option value="CN">{COUNTRY_MAP.CN[lang]}</option>
              <option value="ETC">{COUNTRY_MAP.ETC[lang]}</option>
            </select>
            <button
              onClick={startGame}
              disabled={!canStart}
              style={{
                fontSize: "1.08rem",
                padding: "12px 28px",
                borderRadius: 10,
              }}
            >
              {TEXT[lang].startGame}
            </button>
          </div>
        )}
        {/* 랭킹 보드 */}
        {ranking.length > 0 && (
          <div className="ranking-board">
            <h3
              style={{
                margin: "18px 0 8px 0",
                textAlign: "center",
                fontWeight: 900,
                fontSize: "1.15rem",
                color: "#3b4cca",
                letterSpacing: "-0.5px",
              }}
            >
              {TEXT[lang].rankingBoard}
            </h3>
            <table>
              <thead>
                <tr>
                  <th style={{ fontSize: "1.08rem" }}>
                    {lang === "ko" ? "순위" : "Rank"}
                  </th>
                  <th style={{ fontSize: "1.08rem" }}>
                    {lang === "ko" ? "닉네임" : "Nickname"}
                  </th>
                  <th style={{ fontSize: "1.08rem" }}>{TEXT[lang].country}</th>
                  <th style={{ fontSize: "1.08rem" }}>{TEXT[lang].score}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      i === 0
                        ? "rank-1"
                        : i === 1
                        ? "rank-2"
                        : i === 2
                        ? "rank-3"
                        : undefined
                    }
                    style={{ height: 38 }}
                  >
                    <td style={{ fontSize: "1.15rem", fontWeight: 900 }}>
                      {i === 0 ? (
                        <span className="medal">🥇</span>
                      ) : i === 1 ? (
                        <span className="medal">🥈</span>
                      ) : i === 2 ? (
                        <span className="medal">🥉</span>
                      ) : null}
                      {i + 1}
                    </td>
                    <td style={{ fontSize: "1.08rem", fontWeight: 800 }}>
                      {r.nickname}
                    </td>
                    <td style={{ fontSize: "1.05rem" }}>
                      {r.country !== "ETC" && r.country ? (
                        <img
                          src={`https://flagcdn.com/24x18/${r.country.toLowerCase()}.png`}
                          alt={COUNTRY_MAP[r.country]?.[lang] || r.country}
                          style={{
                            marginRight: 6,
                            verticalAlign: "middle",
                            borderRadius: 2,
                            border: "1px solid #eee",
                            width: 24,
                            height: 18,
                          }}
                        />
                      ) : null}
                      <span
                        style={{
                          verticalAlign: "middle",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                        }}
                      >
                        {COUNTRY_MAP[r.country]?.[lang] || r.country}
                      </span>
                    </td>
                    <td style={{ fontSize: "1.08rem", fontWeight: 900 }}>
                      {r.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {gameState === "show" && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              alignItems: "center",
              margin: "18px 0",
            }}
          >
            {numbers.map((num, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  minWidth: 48,
                  minHeight: 56,
                  fontSize: "1.3rem",
                  padding: "18px 0",
                }}
              >
                {num}
              </div>
            ))}
            <p
              style={{
                fontSize: "1.15rem",
                width: "100%",
                textAlign: "center",
                marginTop: 12,
                fontWeight: 900,
                color: "#3b4cca",
              }}
            >
              {TEXT[lang].memorize}
            </p>
          </div>
        )}
        {gameState === "input" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "12px",
                justifyContent: "center",
              }}
            >
              {choices.map((num, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCardSelect(num)}
                  disabled={
                    selected.includes(num) || selected.length >= memorizeCount
                  }
                  style={{
                    minWidth: 48,
                    minHeight: 56,
                    fontSize: "1.15rem",
                    opacity: selected.includes(num) ? 0.5 : 1,
                    border: selected.includes(num)
                      ? "2px solid #aee1f9"
                      : undefined,
                    margin: 0,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "nowrap",
                minHeight: 32,
                marginBottom: 8,
                overflowX: "auto",
                justifyContent: "center",
              }}
            >
              {selected.map((num, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    minWidth: 36,
                    minHeight: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    background: "#e0f7fa",
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleClear}
                style={{
                  background: "#ffe0e0",
                  fontSize: "0.95rem",
                  padding: "8px 18px",
                  borderRadius: 8,
                }}
              >
                {TEXT[lang].clear}
              </button>
              <button
                onClick={checkAnswer}
                disabled={selected.length !== memorizeCount}
                style={{
                  background:
                    selected.length === memorizeCount ? undefined : "#eee",
                  cursor:
                    selected.length === memorizeCount
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "0.95rem",
                  padding: "8px 18px",
                  borderRadius: 8,
                }}
              >
                {TEXT[lang].submit}
              </button>
            </div>
          </div>
        )}
        {message && (
          <div className="message">
            {message === "정답! 다음 라운드로~"
              ? TEXT[lang].correct
              : message === "오답! 게임 오버!"
              ? TEXT[lang].wrong
              : message}
          </div>
        )}
        {gameState === "over" && (
          <button
            onClick={startGame}
            style={{
              fontSize: "1.08rem",
              padding: "12px 28px",
              borderRadius: 10,
              marginTop: 18,
            }}
          >
            {TEXT[lang].again}
          </button>
        )}
      </header>
    </div>
  );
}

export default App;
