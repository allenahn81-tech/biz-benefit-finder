/* 혜택 검색 사이트 매칭 로직
   혜택검색사이트_프롬프트.txt 의 매칭 규칙을 그대로 코드로 옮긴 것.
   공고 데이터는 data/benefits.js 의 window.BENEFITS 에서 읽는다. */

(function () {
  'use strict';

  /* ---------- 기준 데이터 ---------- */

  // 한국표준산업분류(10차) 중분류. 대분류 → 중분류 목록
  const KSIC = [
    ['A 농업, 임업 및 어업', [['01', '농업'], ['02', '임업'], ['03', '어업']]],
    ['B 광업', [['05', '석탄, 원유 및 천연가스 광업'], ['06', '금속 광업'], ['07', '비금속광물 광업'], ['08', '광업 지원 서비스업']]],
    ['C 제조업', [
      ['10', '식료품 제조업'], ['11', '음료 제조업'], ['12', '담배 제조업'], ['13', '섬유제품 제조업'],
      ['14', '의복, 의복 액세서리 및 모피제품 제조업'], ['15', '가죽, 가방 및 신발 제조업'], ['16', '목재 및 나무제품 제조업'],
      ['17', '펄프, 종이 및 종이제품 제조업'], ['18', '인쇄 및 기록매체 복제업'], ['19', '코크스, 연탄 및 석유정제품 제조업'],
      ['20', '화학 물질 및 화학제품 제조업'], ['21', '의료용 물질 및 의약품 제조업'], ['22', '고무 및 플라스틱제품 제조업'],
      ['23', '비금속 광물제품 제조업'], ['24', '1차 금속 제조업'], ['25', '금속 가공제품 제조업'],
      ['26', '전자 부품, 컴퓨터, 영상, 음향 및 통신장비 제조업'], ['27', '의료, 정밀, 광학 기기 및 시계 제조업'],
      ['28', '전기장비 제조업'], ['29', '기타 기계 및 장비 제조업'], ['30', '자동차 및 트레일러 제조업'],
      ['31', '기타 운송장비 제조업'], ['32', '가구 제조업'], ['33', '기타 제품 제조업'], ['34', '산업용 기계 및 장비 수리업']]],
    ['D 전기, 가스, 증기 및 공기 조절 공급업', [['35', '전기, 가스, 증기 및 공기 조절 공급업']]],
    ['E 수도, 하수 및 폐기물 처리, 원료 재생업', [['36', '수도업'], ['37', '하수, 폐수 및 분뇨 처리업'], ['38', '폐기물 수집, 운반, 처리 및 원료 재생업'], ['39', '환경 정화 및 복원업']]],
    ['F 건설업', [['41', '종합 건설업'], ['42', '전문직별 공사업']]],
    ['G 도매 및 소매업', [['45', '자동차 및 부품 판매업'], ['46', '도매 및 상품 중개업'], ['47', '소매업 (자동차 제외)']]],
    ['H 운수 및 창고업', [['49', '육상 운송 및 파이프라인 운송업'], ['50', '수상 운송업'], ['51', '항공 운송업'], ['52', '창고 및 운송관련 서비스업']]],
    ['I 숙박 및 음식점업', [['55', '숙박업'], ['56', '음식점 및 주점업']]],
    ['J 정보통신업', [['58', '출판업'], ['59', '영상·오디오 기록물 제작 및 배급업'], ['60', '방송업'], ['61', '우편 및 통신업'], ['62', '컴퓨터 프로그래밍, 시스템 통합 및 관리업'], ['63', '정보서비스업']]],
    ['K 금융 및 보험업', [['64', '금융업'], ['65', '보험 및 연금업'], ['66', '금융 및 보험 관련 서비스업']]],
    ['L 부동산업', [['68', '부동산업']]],
    ['M 전문, 과학 및 기술 서비스업', [['70', '연구개발업'], ['71', '전문 서비스업'], ['72', '건축 기술, 엔지니어링 및 기타 과학기술 서비스업'], ['73', '기타 전문, 과학 및 기술 서비스업']]],
    ['N 사업시설 관리, 사업 지원 및 임대 서비스업', [['74', '사업시설 관리 및 조경 서비스업'], ['75', '사업 지원 서비스업'], ['76', '임대업 (부동산 제외)']]],
    ['O 공공 행정, 국방 및 사회보장 행정', [['84', '공공 행정, 국방 및 사회보장 행정']]],
    ['P 교육 서비스업', [['85', '교육 서비스업']]],
    ['Q 보건업 및 사회복지 서비스업', [['86', '보건업'], ['87', '사회복지 서비스업']]],
    ['R 예술, 스포츠 및 여가관련 서비스업', [['90', '창작, 예술 및 여가관련 서비스업'], ['91', '스포츠 및 오락관련 서비스업']]],
    ['S 협회 및 단체, 수리 및 기타 개인 서비스업', [['94', '협회 및 단체'], ['95', '개인 및 소비용품 수리업'], ['96', '기타 개인 서비스업']]],
    ['T 가구 내 고용활동 및 자가 소비 생산활동', [['97', '가구 내 고용활동'], ['98', '달리 분류되지 않은 자가 소비 생산활동']]],
    ['U 국제 및 외국기관', [['99', '국제 및 외국기관']]]
  ];

  const REGIONS = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
    '경기도', '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
  ];

  // 업력 구간 → 개월 범위 [하한 이상, 상한 미만]
  const AGE_RANGES = {
    '1년 미만': [0, 12],
    '1~3년': [12, 36],
    '3~7년': [36, 84],
    '7년 이상': [84, Infinity]
  };

  /* ---------- 유틸 ---------- */

  const $ = (id) => document.getElementById(id);
  const isNil = (v) => v === null || v === undefined || v === '';
  const compact = (s) => String(s || '').replace(/\s+/g, '');

  function todayISO() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function daysBetween(fromISO, toISO) {
    const a = new Date(fromISO + 'T00:00:00');
    const b = new Date(toISO + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function formatWon(n) {
    if (isNil(n)) return null;
    const v = Number(n);
    if (v >= 1e8) {
      const eok = Math.floor(v / 1e8);
      const rest = Math.round((v % 1e8) / 1e4);
      return rest ? `${eok}억 ${rest.toLocaleString('ko-KR')}만원` : `${eok}억원`;
    }
    if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만원`;
    return `${v.toLocaleString('ko-KR')}원`;
  }

  /* ---------- 매칭 규칙 (프롬프트와 1:1 대응) ---------- */

  const PASS = { r: 'pass' };
  const exclude = (why) => ({ r: 'exclude', why });
  const review = (why) => ({ r: 'review', why });

  // 1. 신청 기간
  function checkPeriod(b, today) {
    if (!isNil(b.apply_end) && b.apply_end < today) return exclude('마감 지남');
    if (b.is_always_open) return PASS;
    if (!isNil(b.apply_start) || !isNil(b.apply_end)) return PASS;
    return review('신청 기간 정보가 공고에 없음');
  }

  // 2. 사업자 유형
  function checkEntity(b, u) {
    const types = b.target_entity_types;
    if (u.entity_type === '예비창업자') {
      return Array.isArray(types) && types.includes('예비창업자') ? PASS : exclude('예비창업자 미허용');
    }
    if (isNil(types)) return PASS;
    return types.includes(u.entity_type) ? PASS : exclude('사업자 유형 불일치');
  }

  // 3. 업력
  function checkAge(b, u) {
    if (u.entity_type === '예비창업자') return PASS;
    const min = isNil(b.min_business_age_months) ? null : Number(b.min_business_age_months);
    const max = isNil(b.max_business_age_months) ? null : Number(b.max_business_age_months);
    if (min === null && max === null) {
      return isNil(b.business_age_text) ? PASS : review(`업력 조건이 텍스트로만 있음: "${b.business_age_text}"`);
    }
    const range = AGE_RANGES[u.business_age];
    if (!range) return review('업력 구간이 입력되지 않음');
    const [uLo, uHi] = range;
    const pLo = min === null ? 0 : min;
    const pHi = max === null ? Infinity : max;
    if (uLo >= pLo && uHi <= pHi) return PASS;
    if (uLo >= pHi || uHi <= pLo) return exclude('업력 조건 불일치');
    return review(`업력 구간(${u.business_age})이 공고 조건과 일부만 겹침`);
  }

  // 4. 업종
  // 사용자 업종은 코드 후보 배열(u.ksic_codes). 세부 코드를 입력하면 1개, 중분류면 1개, 대분류면 그 안의 중분류 전부.
  function checkKsic(b, u) {
    const codes = b.target_ksic_codes;
    if (isNil(codes) && isNil(b.target_ksic_text)) return PASS;
    const mine = Array.isArray(u.ksic_codes) ? u.ksic_codes.map(String) : [];
    if (!mine.length) return review('업종이 입력되지 않았는데 공고에 업종 조건이 있음');
    if (Array.isArray(codes) && codes.length) {
      const hit = (m) => codes.some((c) => m === String(c) || m.startsWith(String(c)));
      const n = mine.filter(hit).length;
      if (n === mine.length) return PASS;
      if (n === 0) return exclude('업종 불일치');
      return review('선택한 업종(대분류) 중 일부만 공고 대상 업종에 해당. 세부 업종 코드를 입력하면 확정됨');
    }
    return review(`업종 조건이 텍스트로만 있음: "${b.target_ksic_text}"`);
  }

  // 5. 매출 규모
  function checkRevenue(b, u) {
    if (isNil(b.min_revenue) && isNil(b.max_revenue)) {
      return isNil(b.revenue_text) ? PASS : review(`매출 조건이 텍스트로만 있음: "${b.revenue_text}"`);
    }
    if (isNil(u.annual_revenue)) return review('연매출이 입력되지 않았는데 공고에 매출 조건이 있음');
    const v = Number(u.annual_revenue);
    if (!isNil(b.min_revenue) && v < Number(b.min_revenue)) return exclude('매출 하한 미달');
    if (!isNil(b.max_revenue) && v > Number(b.max_revenue)) return exclude('매출 상한 초과');
    return PASS;
  }

  // 6. 고용 규모
  function checkEmployees(b, u) {
    if (isNil(b.min_employees) && isNil(b.max_employees)) {
      return isNil(b.employees_text) ? PASS : review(`고용 조건이 텍스트로만 있음: "${b.employees_text}"`);
    }
    if (isNil(u.employee_count)) return review('상시근로자 수가 입력되지 않았는데 공고에 고용 조건이 있음');
    const v = Number(u.employee_count);
    if (!isNil(b.min_employees) && v < Number(b.min_employees)) return exclude('고용 하한 미달');
    if (!isNil(b.max_employees) && v > Number(b.max_employees)) return exclude('고용 상한 초과');
    return PASS;
  }

  // 7. 소재지
  function checkRegion(b, u) {
    const regions = b.target_regions;
    const districts = b.target_districts;
    if (isNil(regions) && isNil(districts) && isNil(b.target_region_text)) return PASS;
    if (Array.isArray(regions) && regions.length && !regions.includes(u.region)) return exclude('시/도 불일치');
    if (Array.isArray(districts) && districts.length) {
      if (isNil(u.district)) return review('공고에 시/군/구 조건이 있는데 시/군/구가 입력되지 않음');
      const mine = compact(u.district);
      const hit = districts.some((d) => {
        const dd = compact(d);
        return dd.startsWith(compact(u.region)) && dd.includes(mine);
      });
      return hit ? PASS : exclude('시/군/구 불일치');
    }
    if (isNil(regions) && !isNil(b.target_region_text)) return review(`지역 조건이 텍스트로만 있음: "${b.target_region_text}"`);
    return PASS;
  }

  // 8. 세금 체납
  function checkTax(b, u) {
    if (!u.tax_delinquent) return PASS;
    if (b.excludes_tax_delinquent === true) return exclude('체납자 제외 공고');
    return PASS;
  }

  function evaluate(b, u, today) {
    const checks = [
      checkPeriod(b, today), checkEntity(b, u), checkAge(b, u), checkKsic(b, u),
      checkRevenue(b, u), checkEmployees(b, u), checkRegion(b, u), checkTax(b, u)
    ];
    if (checks.some((c) => c.r === 'exclude')) return { include: false };
    const reasons = checks.filter((c) => c.r === 'review').map((c) => c.why);
    return { include: true, needs_review: reasons.length > 0, review_reason: reasons.join(' / ') || null };
  }

  function sortResults(list) {
    const key = (x) => [
      x.needs_review ? 1 : 0,
      isNil(x.b.apply_end) ? 1 : 0,
      x.b.apply_end || '',
      x.b.apply_start || ''
    ];
    return list.sort((a, c) => {
      const ka = key(a), kc = key(c);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] < kc[i]) return -1;
        if (ka[i] > kc[i]) return 1;
      }
      return 0;
    });
  }

  function match(benefits, user, today) {
    const out = [];
    for (const b of benefits) {
      const r = evaluate(b, user, today);
      if (r.include) out.push({ b, needs_review: r.needs_review, review_reason: r.review_reason });
    }
    return sortResults(out);
  }

  /* ---------- 화면 ---------- */

  function fillSelects() {
    const ksic = $('ksic');
    for (const [section, items] of KSIC) {
      const g = document.createElement('optgroup');
      g.label = section;
      const all = document.createElement('option');
      all.value = section.charAt(0);
      all.textContent = `${section} (전체)`;
      g.appendChild(all);
      for (const [code, name] of items) {
        const o = document.createElement('option');
        o.value = code;
        o.textContent = `${code} ${name}`;
        g.appendChild(o);
      }
      ksic.appendChild(g);
    }
    const region = $('region');
    for (const r of REGIONS) {
      const o = document.createElement('option');
      o.value = r;
      o.textContent = r;
      region.appendChild(o);
    }
  }

  function ksicCandidates(selected, full) {
    if (full) return [full];
    if (!selected) return [];
    if (/^\d/.test(selected)) return [selected];
    const section = KSIC.find(([s]) => s.charAt(0) === selected);
    return section ? section[1].map(([code]) => code) : [];
  }

  function readForm() {
    const entity = $('entity').value;
    const codeFull = $('ksic_full').value.trim();
    const codeMid = $('ksic').value;
    return {
      entity_type: entity,
      business_age: entity === '예비창업자' ? '예비창업자' : $('age').value,
      ksic_codes: ksicCandidates(codeMid, codeFull),
      annual_revenue: $('revenue').value === '' ? null : Math.round(Number($('revenue').value) * 1e4),
      employee_count: $('employees').value === '' ? null : Number($('employees').value),
      region: $('region').value,
      district: $('district').value.trim() || null,
      tax_delinquent: $('tax').value === 'yes'
    };
  }

  function periodLabel(b, today) {
    if (b.is_always_open) return { text: '상시', kind: 'always' };
    if (!isNil(b.apply_start) && b.apply_start > today) return { text: `접수 예정 · ${b.apply_start}부터`, kind: 'upcoming' };
    if (!isNil(b.apply_end)) {
      const d = daysBetween(today, b.apply_end);
      return { text: d === 0 ? '오늘 마감' : `D-${d} · ${b.apply_end} 마감`, kind: d <= 7 ? 'soon' : 'open' };
    }
    return { text: '접수 중', kind: 'open' };
  }

  function periodText(b) {
    if (b.is_always_open) return '상시';
    if (isNil(b.apply_start) && isNil(b.apply_end)) return '공고 확인 필요';
    return `${b.apply_start || '?'} ~ ${b.apply_end || '?'}`;
  }

  function selfFundingText(b) {
    if (!isNil(b.self_funding_ratio)) return `자부담 ${b.self_funding_ratio}%`;
    if (!isNil(b.self_funding_text)) return b.self_funding_text;
    return '공고 확인 필요';
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function renderResults(results, today) {
    const list = $('results');
    list.textContent = '';
    const count = $('count');
    const sure = results.filter((r) => !r.needs_review).length;
    const rev = results.length - sure;
    if (results.length === 0) {
      count.textContent = '조건에 맞는 혜택이 없습니다.';
      $('empty').hidden = false;
      return;
    }
    $('empty').hidden = true;
    count.textContent = rev ? `${results.length}건 (확인 필요 ${rev}건 포함)` : `${results.length}건`;

    for (const r of results) {
      const b = r.b;
      const card = el('article', 'card' + (r.needs_review ? ' card--review' : ''));

      const head = el('div', 'card__head');
      const badges = el('div', 'badges');
      const p = periodLabel(b, today);
      badges.appendChild(el('span', `badge badge--${p.kind}`, p.text));
      if (r.needs_review) badges.appendChild(el('span', 'badge badge--review', '확인 필요'));
      head.appendChild(badges);
      head.appendChild(el('span', 'source', b.source || ''));
      card.appendChild(head);

      card.appendChild(el('h3', 'card__title', b.title));

      const dl = el('dl', 'detail');
      const row = (k, v) => {
        dl.appendChild(el('dt', null, k));
        dl.appendChild(el('dd', null, isNil(v) ? '공고 확인 필요' : v));
      };
      row('지원 내용', b.summary);
      row('대상 조건', b.eligibility_text);
      row('신청 기간', periodText(b));
      row('자부담', selfFundingText(b));
      row('신청 방법', b.how_to_apply);
      if (!isNil(b.contact)) row('문의처', b.contact);
      card.appendChild(dl);

      if (r.needs_review) {
        const note = el('p', 'review-note');
        note.appendChild(el('strong', null, '확인 필요 사유 '));
        note.appendChild(document.createTextNode(r.review_reason));
        card.appendChild(note);
      }

      const foot = el('div', 'card__foot');
      if (!isNil(b.url)) {
        const a = el('a', 'link', '공고 원문 보기');
        a.href = b.url;
        a.target = '_blank';
        a.rel = 'noopener';
        foot.appendChild(a);
      } else {
        foot.appendChild(el('span', 'muted', '출처 링크 없음'));
      }
      foot.appendChild(el('span', 'muted', b.benefit_id || ''));
      card.appendChild(foot);

      list.appendChild(card);
    }
  }

  function run() {
    const user = readForm();
    const today = todayISO();
    const benefits = Array.isArray(window.BENEFITS) ? window.BENEFITS : [];
    const results = match(benefits, user, today);
    renderResults(results, today);
    $('results-head').hidden = false;
    try { localStorage.setItem('benefit-search-form', JSON.stringify(serializeForm())); } catch (e) { /* 저장 불가 환경 */ }
  }

  function serializeForm() {
    const ids = ['entity', 'age', 'ksic', 'ksic_full', 'revenue', 'employees', 'region', 'district', 'tax'];
    const o = {};
    for (const id of ids) o[id] = $(id).value;
    return o;
  }

  function restoreForm() {
    try {
      const raw = localStorage.getItem('benefit-search-form');
      if (!raw) return false;
      const o = JSON.parse(raw);
      for (const id in o) if ($(id)) $(id).value = o[id];
      return true;
    } catch (e) { return false; }
  }

  // 예시 입력값은 config.js 의 SITE_CONFIG.defaults 에서 읽는다.
  function applyDefaults() {
    const d = (window.SITE_CONFIG && window.SITE_CONFIG.defaults) || {};
    for (const id in d) if ($(id)) $(id).value = d[id];
  }

  function syncEntity() {
    const pre = $('entity').value === '예비창업자';
    $('age-field').hidden = pre;
    $('tax-field').hidden = false;
  }

  function init() {
    fillSelects();
    $('today').textContent = todayISO();
    const all = Array.isArray(window.BENEFITS) ? window.BENEFITS : [];
    const n = all.length;
    const s = all.filter((b) => String(b.title || '').startsWith('[샘플]')).length;
    $('data-note').textContent = s === n && n > 0
      ? `지금은 샘플 공고 ${n}건으로 동작합니다. data/benefits.js를 수집기 출력으로 바꾸면 실제 공고로 검색됩니다.`
      : s > 0
        ? `공고 ${n}건 기준 (화면 확인용 샘플 ${s}건 포함)`
        : `공고 ${n}건 기준`;

    const restored = restoreForm();
    if (!restored) applyDefaults();
    syncEntity();

    $('entity').addEventListener('change', syncEntity);
    $('form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
    $('reset').addEventListener('click', () => {
      $('form').reset();
      try { localStorage.removeItem('benefit-search-form'); } catch (e) { /* ignore */ }
      syncEntity();
      $('results').textContent = '';
      $('results-head').hidden = true;
      $('empty').hidden = true;
    });

    run();
  }

  window.BenefitSearch = { evaluate, match, KSIC, REGIONS };
  document.addEventListener('DOMContentLoaded', init);
})();
