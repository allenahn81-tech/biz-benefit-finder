# 기업 혜택 찾기

사업자 정보를 입력하면 정부·지자체가 제공하는 세제혜택, 지원금, 보조금, 융자 중 조건이 맞는 것만 골라 보여주는 정적 사이트입니다.

## 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 (입력 패널 + 결과 카드) |
| `app.js` | 매칭 로직. 8개 조건(신청 기간, 사업자 유형, 업력, 업종, 매출, 고용, 소재지, 세금 체납)을 판정 |
| `data/benefits.js` | 공고 데이터. 수집기 출력으로 교체하는 파일 |
| `config.js` | 첫 화면 예시 입력값(소재지 등). 제출처가 바뀌면 이 파일만 수정 |
| `tests/match.test.js` | 매칭 규칙 테스트 (`node --test`) |
| `scripts/serve.js` | 로컬 미리보기 서버 (`node scripts/serve.js`) |
| `사용법.txt` | 데이터 형식과 운영 방법 |

서버나 빌드 없이 브라우저만으로 동작합니다. 공고 수집은 별도 시스템이 담당하고, 이 사이트는 수집된 데이터를 판정해서 보여줍니다.

## 로컬 실행

`index.html`을 브라우저로 열거나 `node scripts/serve.js` 후 http://127.0.0.1:8765 에 접속합니다.

## 테스트

```
node --test
```

테스트는 자체 공고 픽스처를 쓰므로 `data/benefits.js`를 실제 데이터로 바꿔도 그대로 돌아갑니다. 데이터 파일은 형식만 점검합니다.

## 배포

Vercel 프로젝트 `biz-benefit-finder`가 이 GitHub 저장소에 연결되어 있어 `main`에 푸시하면 자동 배포됩니다. Framework Preset은 Other, Root Directory는 저장소 루트입니다. `tests/`, `scripts/`, `.claude/`는 `.vercelignore`로 배포에서 제외합니다.

## 데이터 넣기

`data/benefits.js`의 `window.BENEFITS` 배열을 교체합니다. 필드 정의는 `사용법.txt`를 참고하세요. 숫자로 적을 수 없는 조건은 `*_text` 필드에 원문을 넣으면 "확인 필요"로 표시됩니다.
