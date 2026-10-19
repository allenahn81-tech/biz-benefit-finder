/* 매칭 규칙 테스트. 실행: node --test (이 폴더에서)
   규칙은 혜택검색사이트_프롬프트.txt 의 [매칭 규칙]·[정렬 규칙]과 1:1 대응.
   공고는 테스트 안에서 직접 만들므로 data/benefits.js 를 실제 데이터로 바꿔도 깨지지 않는다. */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function load(...files) {
  const ctx = { document: { addEventListener() {} }, console };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return ctx;
}

const { match } = load('app.js').BenefitSearch;
const TODAY = '2026-10-19';

// 조건 없는 공고. 테스트마다 필요한 필드만 덮어쓴다.
function notice(over) {
  return Object.assign({
    benefit_id: 'T', title: 'T', target_entity_types: null,
    min_business_age_months: null, max_business_age_months: null, business_age_text: null,
    target_ksic_codes: null, target_ksic_text: null,
    max_revenue: null, min_revenue: null, revenue_text: null,
    max_employees: null, min_employees: null, employees_text: null,
    target_regions: null, target_districts: null, target_region_text: null,
    excludes_tax_delinquent: null, self_funding_ratio: null, self_funding_text: null,
    apply_start: '2026-10-01', apply_end: '2026-11-30', is_always_open: false
  }, over);
}

const USER = {
  entity_type: '개인', business_age: '1~3년', ksic_codes: ['56111'],
  annual_revenue: 300000000, employee_count: 3,
  region: '서울특별시', district: '영등포구', tax_delinquent: false
};

// 결과: 'pass' | 'review' | 'exclude'
function verdict(over, user) {
  const r = match([notice(over)], Object.assign({}, USER, user), TODAY);
  if (!r.length) return 'exclude';
  return r[0].needs_review ? 'review' : 'pass';
}

test('1. 신청 기간', () => {
  assert.equal(verdict({ apply_end: '2026-10-18' }), 'exclude');
  assert.equal(verdict({ apply_end: TODAY }), 'pass');
  assert.equal(verdict({ apply_start: '2026-11-01', apply_end: '2026-11-30' }), 'pass'); // 접수 예정
  assert.equal(verdict({ apply_start: null, apply_end: null, is_always_open: true }), 'pass');
  assert.equal(verdict({ apply_start: null, apply_end: null }), 'review');
});

test('2. 사업자 유형', () => {
  const pre = { entity_type: '예비창업자', business_age: '예비창업자' };
  assert.equal(verdict({ target_entity_types: null }, pre), 'exclude');
  assert.equal(verdict({ target_entity_types: ['개인', '법인'] }, pre), 'exclude');
  assert.equal(verdict({ target_entity_types: ['예비창업자'] }, pre), 'pass');
  assert.equal(verdict({ target_entity_types: null }), 'pass');
  assert.equal(verdict({ target_entity_types: ['법인'] }), 'exclude');
});

test('3. 업력', () => {
  assert.equal(verdict({ max_business_age_months: 36 }), 'pass');                    // 12~36 ⊂ 0~36
  assert.equal(verdict({ max_business_age_months: 36 }, { business_age: '3~7년' }), 'exclude');
  assert.equal(verdict({ max_business_age_months: 24 }), 'review');                  // 일부만 겹침
  assert.equal(verdict({ business_age_text: '창업 후 3년 이내' }), 'review');
  assert.equal(verdict({ max_business_age_months: 12 }, { entity_type: '예비창업자', business_age: '예비창업자' }), 'exclude'); // 유형에서 제외
});

test('4. 업종', () => {
  assert.equal(verdict({ target_ksic_codes: ['56'] }), 'pass');
  assert.equal(verdict({ target_ksic_codes: ['62'] }), 'exclude');
  assert.equal(verdict({ target_ksic_text: '음식점업' }), 'review');
  assert.equal(verdict({ target_ksic_codes: ['62'] }, { ksic_codes: ['58', '59', '60', '61', '62', '63'] }), 'review'); // 대분류 선택
  assert.equal(verdict({ target_ksic_codes: ['56'] }, { ksic_codes: [] }), 'review');
});

test('5. 매출 규모', () => {
  assert.equal(verdict({ max_revenue: 1e9 }), 'pass');
  assert.equal(verdict({ max_revenue: 1e8 }), 'exclude');
  assert.equal(verdict({ min_revenue: 5e8 }), 'exclude');
  assert.equal(verdict({ revenue_text: '업종별 평균매출액 10억원 이하' }), 'review');
  assert.equal(verdict({ max_revenue: 1e9 }, { annual_revenue: null }), 'review');
});

test('6. 고용 규모', () => {
  assert.equal(verdict({ max_employees: 5 }), 'pass');
  assert.equal(verdict({ max_employees: 2 }), 'exclude');
  assert.equal(verdict({ min_employees: 5 }), 'exclude');
  assert.equal(verdict({ employees_text: '제조업 10인 미만' }), 'review');
  assert.equal(verdict({ max_employees: 5 }, { employee_count: null }), 'review');
});

test('7. 소재지', () => {
  assert.equal(verdict({ target_regions: ['경기도'] }), 'exclude');
  assert.equal(verdict({ target_regions: ['서울특별시'] }), 'pass');
  assert.equal(verdict({ target_regions: ['서울특별시'], target_districts: ['서울특별시 영등포구'] }), 'pass');
  assert.equal(verdict({ target_regions: ['서울특별시'], target_districts: ['서울특별시 종로구'] }), 'exclude');
  assert.equal(verdict({ target_districts: ['서울특별시 영등포구'] }, { district: null }), 'review');
  assert.equal(verdict({ target_region_text: '여의도 금융특구 입주기업' }), 'review');
});

test('8. 세금 체납', () => {
  assert.equal(verdict({ excludes_tax_delinquent: true }, { tax_delinquent: true }), 'exclude');
  assert.equal(verdict({ excludes_tax_delinquent: null }, { tax_delinquent: true }), 'pass');
  assert.equal(verdict({ excludes_tax_delinquent: true }), 'pass');
});

test('자부담은 판정에 쓰지 않음', () => {
  assert.equal(verdict({ self_funding_ratio: 90 }), 'pass');
});

test('확인필요 사유는 걸린 조건을 모두 담음', () => {
  const r = match([notice({ revenue_text: 'a', employees_text: 'b' })], USER, TODAY);
  assert.equal(r[0].needs_review, true);
  assert.match(r[0].review_reason, /매출/);
  assert.match(r[0].review_reason, /고용/);
});

test('정렬: 확실 → 확인필요, 각 그룹 마감 임박순, 상시는 그룹 맨 뒤', () => {
  const list = [
    notice({ benefit_id: 'R-late', apply_end: '2026-12-31', revenue_text: 'x' }),
    notice({ benefit_id: 'P-always', apply_start: null, apply_end: null, is_always_open: true }),
    notice({ benefit_id: 'P-late', apply_end: '2026-12-31' }),
    notice({ benefit_id: 'R-soon', apply_end: '2026-10-25', revenue_text: 'x' }),
    notice({ benefit_id: 'P-soon', apply_end: '2026-10-25' }),
    notice({ benefit_id: 'P-soon-early', apply_start: '2026-09-01', apply_end: '2026-10-25' })
  ];
  const ids = [...match(list, USER, TODAY).map((r) => r.b.benefit_id)];
  assert.deepEqual(ids, ['P-soon-early', 'P-soon', 'P-late', 'P-always', 'R-soon', 'R-late']);
});

test('맞는 공고가 없으면 빈 배열', () => {
  const list = [notice({ apply_end: '2026-01-01' }), notice({ target_regions: ['부산광역시'] })];
  assert.equal(match(list, USER, TODAY).length, 0);
});

test('data/benefits.js 형식 점검', () => {
  const { BENEFITS } = load('data/benefits.js');
  assert.ok(Array.isArray(BENEFITS) && BENEFITS.length > 0);
  const ids = new Set();
  for (const b of BENEFITS) {
    assert.ok(b.benefit_id && !ids.has(b.benefit_id), `benefit_id 중복 또는 누락: ${b.benefit_id}`);
    ids.add(b.benefit_id);
    for (const k of ['source', 'title', 'eligibility_text', 'how_to_apply']) assert.ok(b[k], `${b.benefit_id}: ${k} 없음`);
    for (const k of ['apply_start', 'apply_end']) assert.ok(b[k] === null || /^\d{4}-\d{2}-\d{2}$/.test(b[k]), `${b.benefit_id}: ${k} 형식`);
    assert.equal(typeof b.is_always_open, 'boolean', `${b.benefit_id}: is_always_open`);
    for (const d of b.target_districts || []) assert.match(d, /^\S+ \S+$/, `${b.benefit_id}: target_districts 는 '시/도 시/군/구'`);
  }
});

test('config.js 기본값이 화면 선택지와 맞음', () => {
  const ctx = load('config.js', 'app.js');
  const d = ctx.SITE_CONFIG.defaults;
  assert.ok(ctx.BenefitSearch.REGIONS.includes(d.region), `region: ${d.region}`);
  assert.ok(['개인', '법인', '예비창업자'].includes(d.entity));
});
