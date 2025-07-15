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

  // 라운드별 난이도 조정
  const memorizeCount = Math.min(3 + round - 1, 8); // 암기 숫자 개수 (최대 8)
  const choiceCount = memorizeCount + Math.min(6 + round - 1, 12); // 보기 카드 개수 (최대 20)
  const memorizeTime = Math.max(2000 - (round - 1) * 300, 1000); // 암기 시간(ms), 최소 1초

  // 게임 시작 전 입력 폼 유효성
  const canStart = userInput.nickname.trim() && userInput.country.trim();

  // 서버에서 랭킹 불러오기
  const fetchRanking = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/rankings");
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
      fetch("http://localhost:4000/api/rankings", {
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
        const extra = getRandomNumbers(
          choiceCount - memorizeCount,
          0,
          99,
          numbers
        );
        setChoices(shuffle([...numbers, ...extra]));
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
        <h1>숫자 Memory Rush</h1>
        <p>
          라운드: {round} / 점수: {score}
        </p>
        {/* 게임 시작 전 사용자 정보 입력 */}
        {gameState === "ready" && (
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="닉네임"
              value={userInput.nickname}
              onChange={(e) =>
                setUserInput((u) => ({ ...u, nickname: e.target.value }))
              }
              style={{
                marginRight: 8,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
            <select
              value={userInput.country}
              onChange={(e) =>
                setUserInput((u) => ({ ...u, country: e.target.value }))
              }
              style={{
                marginRight: 8,
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="">국적 선택</option>
              <option value="KR">대한민국</option>
              <option value="US">미국</option>
              <option value="JP">일본</option>
              <option value="CN">중국</option>
              <option value="ETC">기타</option>
            </select>
            <button onClick={startGame} disabled={!canStart}>
              게임 시작
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
                fontWeight: 800,
              }}
            >
              랭킹 보드
            </h3>
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>닉네임</th>
                  <th>국적</th>
                  <th>점수</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.nickname}</td>
                    <td>{r.country}</td>
                    <td>{r.score}</td>
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
              margin: "24px 0",
            }}
          >
            {numbers.map((num, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  minWidth: 60,
                  minHeight: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.2rem",
                }}
              >
                {num}
              </div>
            ))}
            <p
              style={{
                fontSize: "1rem",
                width: "100%",
                textAlign: "center",
                marginTop: 16,
              }}
            >
              숫자를 외우세요!
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
                marginBottom: "18px",
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
                    minWidth: 60,
                    minHeight: 80,
                    fontSize: "1.5rem",
                    opacity: selected.includes(num) ? 0.5 : 1,
                    border: selected.includes(num)
                      ? "2px solid #aee1f9"
                      : undefined,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "nowrap",
                minHeight: 48,
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
                    minWidth: 40,
                    minHeight: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                    background: "#e0f7fa",
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleClear} style={{ background: "#ffe0e0" }}>
                지우기
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
                }}
              >
                제출
              </button>
            </div>
          </div>
        )}
        {message && <div className="message">{message}</div>}
        {gameState === "over" && <button onClick={startGame}>다시 시작</button>}
      </header>
    </div>
  );
}

export default App;
