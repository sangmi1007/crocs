const stage  = document.getElementById('stage');
const dotsEl = document.getElementById('dots');

/* ---- 설정값 ---- */
const OFFSET = 104;              // 이미지 간 간격 (이미지 너비 대비 %)
const SCALE  = [1, 0.62, 0.4];   // 가운데 / 바로 옆 / 그 바깥
let cur = 1;                     // 처음에 가운데 올 슬라이드 (0부터)

/* ---- 슬라이드가 5개 미만이면 복제해서 순환이 자연스럽게 ---- */
const originals = [...stage.querySelectorAll('.item')];
const M = originals.length;      // 실제 슬라이드 개수 (점 개수)
if (M < 5) {
  originals.forEach(el => stage.appendChild(el.cloneNode(true)));
}
const items = [...stage.querySelectorAll('.item')];
const N = items.length;
const prev = new Array(N).fill(null);

/* ---- 하단 점 생성 ---- */
const dots = originals.map((_, k) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', (k + 1) + '번째 슬라이드');
  b.addEventListener('click', () => {
    let d = (k - (cur % M) + M) % M;
    if (d > M / 2) d -= M;
    go(d);
  });
  dotsEl.appendChild(b);
  return b;
});

/* ---- 현재 기준 상대 위치 (순환) ---- */
function pos(i) {
  let p = (i - cur) % N;
  if (p > N / 2)  p -= N;
  if (p < -N / 2) p += N;
  return p;
}

/* ---- 화면 갱신 ---- */
function render() {
  items.forEach((el, i) => {
    const p = pos(i);
    const a = Math.abs(p);

    // 맨 왼쪽 → 맨 오른쪽으로 넘어갈 때는
    // 투명한 상태에서 애니메이션 없이 반대편으로 순간이동
    const jump = prev[i] !== null && Math.abs(p - prev[i]) > 2;
    if (jump) el.style.transition = 'none';

    el.style.transform =
      `translate(calc(-50% + ${p * OFFSET}%), -50%) scale(${SCALE[Math.min(a, 2)]})`;
    el.style.opacity = a > 1 ? 0 : 1;   // 가운데 + 양옆 1개씩만 보임
    el.style.zIndex  = 10 - a;
    el.setAttribute('aria-hidden', p !== 0);

    if (jump) {
      void el.offsetWidth;              // 강제 리플로우
      el.style.transition = '';
    }
    prev[i] = p;
  });

  dots.forEach((d, k) => d.classList.toggle('on', k === cur % M));
}

/* d = +1 : 다음(오른쪽 이미지가 가운데로), -1 : 이전 */
function go(d) {
  cur = ((cur + d) % N + N) % N;
  render();
}
render();

/* ---- 드래그 / 스와이프 ---- */
let startX = null;
let moved  = false;

stage.addEventListener('pointerdown', e => {
  startX = e.clientX;
  moved = false;
  stage.classList.add('drag');
});
window.addEventListener('pointermove', e => {
  if (startX !== null && Math.abs(e.clientX - startX) > 8) moved = true;
});
window.addEventListener('pointerup', e => {
  if (startX === null) return;
  const dx = e.clientX - startX;
  startX = null;
  stage.classList.remove('drag');

  if (dx < -50) go(1);          // 오른쪽 → 왼쪽으로 밀기
  else if (dx > 50) go(-1);     // 왼쪽 → 오른쪽으로 밀기

  setTimeout(() => (moved = false), 0);
});

/* ---- 옆 이미지를 클릭하면 가운데로 ---- */
items.forEach((el, i) => {
  el.addEventListener('click', () => {
    if (moved) return;
    const p = pos(i);
    if (p !== 0) go(p);
  });
});

/* ---- 키보드 / 트랙패드 ---- */
stage.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowLeft')  go(-1);
});
stage.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) > 30) {
    e.preventDefault();
    go(e.deltaX > 0 ? 1 : -1);
  }
}, { passive: false });