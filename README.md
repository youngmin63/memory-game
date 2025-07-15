# 리팩토링 안내 (Vercel + Supabase)

## 구조

- `/src` : React 프론트엔드
- `/api/rankings.js` : Serverless Function (순위 등록/조회)

## 환경변수

- `.env` 파일 또는 Vercel 환경변수에 아래 값 추가
  - `SUPABASE_URL=본인_supabase_url`
  - `SUPABASE_KEY=본인_supabase_anon_key`

## 배포

1. GitHub에 코드 push
2. Vercel에서 새 프로젝트로 연결
3. 환경변수 등록
4. 자동 빌드/배포

## Supabase 테이블 예시

- rankings (id, nickname, country, score, created_at)

---
