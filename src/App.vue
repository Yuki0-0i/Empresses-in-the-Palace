<template>
  <div class="app">
    <!-- 台词弹幕（答题阶段底部飘过） -->
    <div class="danmaku-layer">
      <transition-group name="danmaku">
        <div
          v-for="d in danmakuList"
          :key="d.key"
          class="danmaku"
          :style="{ '--dcolor': d.color, animationDuration: d.duration, top: d.top }"
        >
          <span v-if="d.name" class="danmaku-name">{{ d.name }}：</span>{{ d.quote }}
        </div>
      </transition-group>
    </div>

    <!-- 入口 -->
    <section v-if="stage === 'home'" class="page home-page">
      <div class="scroll-card">
        <div class="scroll-top">
          <span class="seal">甄</span>
          <h1 class="title">甄嬛传性格测试</h1>
          <p class="subtitle">你是宫里哪一位？</p>
        </div>
        <div class="scroll-body">
          <p class="desc">{{ intro.desc }}</p>
          <div class="tips">
            <p v-for="(t, i) in intro.tips" :key="i" class="tip">
              <span class="tip-dot"></span>{{ t }}
            </p>
          </div>
          <div class="mode-buttons">
            <button class="btn-mode primary" @click="startMode('full')">
              <span class="btn-title">开始测试 · 20 题</span>
              <span class="btn-sub">约 5 分钟 · 对照 8 位宫中人物</span>
            </button>
          </div>
          <p class="footnote">本测试为娱乐向 · 非专业心理测验 · 仅供玩梗互动</p>
        </div>
        <div class="scroll-bottom"></div>
      </div>
    </section>

    <!-- 答题 -->
    <section v-else-if="stage === 'quiz'" class="page quiz-page">
      <div class="quiz-progress">
        <div class="progress-bar"><div class="progress-fill" :style="{ width: progress + '%' }"></div></div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questionList.length }}</span>
      </div>

      <transition name="slide" mode="out-in">
        <div class="scroll-card quiz-card" :key="currentIndex">
          <div class="scroll-top mini">
            <span class="q-badge">{{ currentIndex + 1 }}</span>
            <h2 class="q-title">{{ currentQuestion.q }}</h2>
          </div>
          <div class="scroll-body">
            <div class="options">
              <button v-for="(optText, oi) in currentQuestion.options" :key="oi" class="option" @click="selectAnswer(oi)">
                <span class="opt-label">{{ optionLabel(oi) }}</span>
                <span class="opt-text">{{ optText }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <div class="quiz-nav">
        <button v-if="currentIndex > 0" class="btn-prev" @click="prevQuestion">← 上一题</button>
        <span v-else></span>
        <span v-if="answers[currentIndex]" class="answered-dot">已答</span>
      </div>
    </section>

    <!-- 匹配中 -->
    <section v-else-if="stage === 'matching'" class="page matching-page">
      <div class="scroll-card matching-card">
        <div class="matching-loader"><span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span></div>
        <h2 class="matching-title">正在推算你的命数…</h2>
        <p class="matching-sub">对照 8 位宫中人物，寻找与你最像的那一位</p>
      </div>
    </section>

    <!-- 结果 -->
    <section v-else class="page result-page">
      <div class="result-wrap">
        <!-- 完整版 Top1 -->
        <div v-if="match" class="scroll-card result-hero">
          <div class="scroll-top">
            <span class="q-title center">{{ match.emoji }} {{ match.name }}</span>
          </div>
          <div class="scroll-body">
            <div v-if="matchInfo.badge" class="result-badge">🏆 {{ matchInfo.badge }}</div>
            <div class="result-tag">{{ match.tag }}</div>
            <div class="result-score"><span class="score-num">{{ topPercent }}</span><span class="score-unit">% 契合</span></div>
            <p class="result-diff">你和 TA 有 {{ topDiff }} 题选得不一样</p>
            <p class="result-one-liner">{{ match.oneLiner }}</p>
            <div class="result-meta">
              <span class="meta-chip">家世：{{ match.family }}</span>
            </div>
          </div>
        </div>

        <!-- 低置信度提示 -->
        <div v-if="matchInfo.lowConfidence" class="scroll-card lowconf-card">
          <div class="scroll-top"><h2 class="q-title center">你谁都不像</h2></div>
          <div class="scroll-body">
            <p class="analysis-text">你的契合度低于 45%，和这几位都不太像——也许你更像你自己。</p>
          </div>
        </div>

        <div v-if="match" class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">人物档案</h2></div>
          <div class="scroll-body">
            <h3 class="sec-title">家世底子</h3>
            <p class="analysis-text">{{ match.familyDetail }}</p>
            <h3 class="sec-title">剧中证据</h3>
            <p class="analysis-text">{{ match.evidence }}</p>
            <h3 class="sec-title">强项 / 盲点</h3>
            <p class="analysis-text">{{ match.strengths }}</p>
          </div>
        </div>

        <div v-if="match" class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">盲点与建议</h2></div>
          <div class="scroll-body">
            <h3 class="sec-title">你的盲点</h3>
            <p class="analysis-text">{{ match.blindspot }}</p>
            <h3 class="sec-title">给你的建议</h3>
            <p class="analysis-text advice">{{ match.advice }}</p>
          </div>
        </div>

        <!-- 宫里关系 -->
        <div v-if="match" class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">{{ relationTitle }}</h2></div>
          <div class="scroll-body">
            <div class="relation-row">
              <div class="rel-item"><span class="rel-label">天然盟友</span><span class="rel-val">{{ match.allies }}</span></div>
              <div class="rel-item"><span class="rel-label">天然对头</span><span class="rel-val">{{ match.foes }}</span></div>
            </div>
            <p class="relation-line">{{ match.relationLine }}</p>
          </div>
        </div>

        <!-- 契合度排行（两种模式都显示） -->
        <div class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">8 位人物契合度</h2></div>
          <div class="scroll-body">
            <div class="rank-list">
              <div v-for="(g, i) in ranked" :key="g.id" class="rank-item" :class="{ top: i === 0 }">
                <span class="rank-no">{{ i + 1 }}</span>
                <span class="rank-name" :style="{ color: guestColor(g.name) }">{{ g.name }}</span>
                <div class="rank-bar"><div class="rank-fill" :style="{ width: g.percent + '%', background: guestColor(g.name) }"></div></div>
                <span class="rank-percent">{{ g.percent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 若谁都不像 -->
        <div v-if="!match" class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">也许你更像你自己</h2></div>
          <div class="scroll-body">
            <p class="analysis-text">你和这几位都不太像，也许你更像你自己。</p>
          </div>
        </div>

        <!-- 参考文献 -->
        <div class="scroll-card">
          <div class="scroll-top"><h2 class="q-title center">参考文献</h2></div>
          <div class="scroll-body">
            <ol class="ref-list">
              <li v-for="(r, i) in references" :key="i">{{ r }}</li>
            </ol>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn-restart" @click="goHome">再测一次</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { intro, questions } from './data/questions.js'
import { characters, relationTitle } from './data/characters.js'
import { characterQuotes, sharedQuotes, references } from './data/quotes.js'
import { matchResult } from './logic/match.js'

const stage = ref('home')
const currentIndex = ref(0)
const answers = ref([])
let matchTimer = null

const questionList = questions
const currentQuestion = computed(() => questionList[currentIndex.value])
const progress = computed(() => (currentIndex.value / questionList.length) * 100)

const OPT_LABELS = ['A', 'B', 'C', 'D']
function optionLabel(oi) {
  return OPT_LABELS[oi] || ''
}

function startMode() {
  stage.value = 'quiz'
  currentIndex.value = 0
  answers.value = []
}

function selectAnswer(oi) {
  answers.value[currentIndex.value] = OPT_LABELS[oi]
  if (currentIndex.value < questionList.length - 1) {
    currentIndex.value++
  } else {
    stage.value = 'matching'
    matchTimer = setTimeout(showResult, 1400)
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function showResult() {
  stage.value = 'result'
}

const matchInfo = computed(() => matchResult(answers.value))
const ranked = computed(() => matchInfo.value.ranked)
// 结果人物 = 契合度第一名的完整档案
const match = computed(() => {
  const t = matchInfo.value.top
  return characters.find((c) => c.name === t?.name) || null
})
const topPercent = computed(() => (matchInfo.value.top ? matchInfo.value.top.percent : 0))
const topDiff = computed(() => (matchInfo.value.top ? matchInfo.value.top.diff : 0))

function guestColor(name) {
  return characters.find((c) => c.name === name)?.color || '#a52620'
}

function goHome() {
  clearTimeout(matchTimer)
  stage.value = 'home'
  currentIndex.value = 0
  answers.value = []
}

// ------- 台词弹幕（quiz 阶段底部飘过） -------
const danmakuList = ref([])
let danmakuTimer = null
let danmakuSeq = 0

function stopDanmaku() {
  clearTimeout(danmakuTimer)
  danmakuTimer = null
  danmakuList.value = []
}

function startDanmaku() {
  if (danmakuTimer) return
  const pool = []
  characterQuotes.forEach((c) => c.quotes.forEach((q) => pool.push({ name: c.name, color: c.color, quote: q })))
  sharedQuotes.forEach((q) => pool.push({ name: '', color: '#8a7060', quote: q }))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  let idx = 0
  function spawnOne() {
    const item = shuffled[idx % shuffled.length]
    const duration = (12 + Math.random() * 6).toFixed(1) + 's'
    const key = 'dm-' + danmakuSeq++
    const top = (70 + Math.random() * 22).toFixed(1) + '%'
    danmakuList.value.push({ key, name: item.name, color: item.color, quote: item.quote, duration, top })
    setTimeout(() => {
      danmakuList.value = danmakuList.value.filter((d) => d.key !== key)
    }, 18000)
    idx++
    danmakuTimer = setTimeout(spawnOne, 2600 + Math.random() * 1400)
  }
  spawnOne()
}

watch(stage, (s) => {
  if (s === 'quiz') startDanmaku()
  else stopDanmaku()
})

onMounted(() => {})
onBeforeUnmount(() => {
  clearTimeout(matchTimer)
  clearTimeout(danmakuTimer)
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'KaiTi', 'STKaiti', 'SimSun', serif;
  background:
    radial-gradient(900px 500px at 20% -10%, rgba(160, 40, 30, 0.08), transparent 60%),
    radial-gradient(800px 400px at 90% 10%, rgba(120, 60, 40, 0.1), transparent 55%),
    linear-gradient(180deg, #f5ead0 0%, #ece0b8 50%, #f0e6c4 100%);
  background-color: #f0e6c4;
  color: #3d2f1f;
  padding: 28px 16px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page {
  width: 100%;
  max-width: 680px;
  position: relative;
  z-index: 1;
}

/* ---------- 卷轴卡片 ---------- */
.scroll-card {
  position: relative;
  background:
    radial-gradient(ellipse at top, rgba(160, 40, 30, 0.05), transparent 60%),
    linear-gradient(180deg, #f8efd5 0%, #f3e7c2 100%);
  border: 1px solid #c8a56b;
  border-radius: 6px;
  box-shadow:
    0 6px 24px rgba(70, 45, 20, 0.18),
    inset 0 0 40px rgba(120, 80, 30, 0.06);
  margin-bottom: 22px;
  overflow: hidden;
}
.scroll-card::before,
.scroll-card::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 18px;
  background: linear-gradient(90deg, #8a5a2b, #a0753a);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.35);
}
.scroll-card::before { left: -9px; border-radius: 3px; }
.scroll-card::after { right: -9px; border-radius: 3px; }

.scroll-top {
  position: relative;
  text-align: center;
  padding: 22px 34px 6px;
  border-bottom: 2px solid #b06a48;
}
.scroll-top.mini {
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 30px 14px;
  border-bottom: 1px solid #c8a56b;
}
.scroll-top.mini .q-title {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}
.scroll-body {
  padding: 18px 30px 26px;
}
.scroll-bottom {
  height: 12px;
  background: linear-gradient(180deg, rgba(160, 40, 30, 0.06), transparent);
  border-top: 1px solid #d4b585;
}

/* 印章 */
.seal {
  display: inline-block;
  width: 46px;
  height: 46px;
  line-height: 46px;
  border-radius: 6px;
  background: #a52620;
  color: #f6ead0;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(160, 40, 30, 0.4);
  font-family: 'KaiTi', 'STKaiti', serif;
}
.title {
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 30px;
  font-weight: 700;
  color: #5c1e12;
  margin: 0 0 4px;
  letter-spacing: 0.08em;
}
.subtitle {
  color: #7a5630;
  font-size: 15px;
  margin: 0;
  letter-spacing: 0.1em;
}
.desc {
  text-align: center;
  color: #5c1e12;
  font-size: 14px;
  margin: 0 0 16px;
}
.tips {
  background: rgba(160, 40, 30, 0.04);
  border: 1px solid #d4b585;
  border-radius: 6px;
  padding: 12px 18px;
  margin-bottom: 20px;
}
.tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 13.5px;
  color: #5a4430;
  line-height: 1.6;
}
.tip:last-child { margin-bottom: 0; }
.tip-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a52620;
  margin-top: 8px;
}

.mode-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.btn-mode {
  flex: 1;
  border: 1.5px solid #a52620;
  border-radius: 6px;
  padding: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  background: transparent;
}
.btn-mode.primary {
  background: linear-gradient(135deg, #a52620, #c0392b);
  color: #f6ead0;
}
.btn-mode.ghost {
  color: #5c1e12;
}
.btn-mode:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(160, 40, 30, 0.25);
}
.btn-title {
  font-size: 17px;
  font-weight: 700;
  font-family: 'KaiTi', 'STKaiti', serif;
  letter-spacing: 0.04em;
}
.btn-sub {
  font-size: 12px;
  opacity: 0.85;
}
.footnote {
  text-align: center;
  font-size: 12px;
  color: #8a7060;
  margin: 0;
}

/* ---------- 答题 ---------- */
.quiz-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.progress-bar {
  flex: 1;
  height: 7px;
  border-radius: 999px;
  background: rgba(160, 40, 30, 0.15);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #a52620, #c0392b);
  transition: width 0.3s;
}
.progress-text {
  font-size: 13px;
  color: #6a4a28;
  font-weight: 700;
}
.q-badge {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: linear-gradient(135deg, #a52620, #c0392b);
  color: #f6ead0;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'KaiTi', serif;
}
.q-title {
  color: #5c1e12;
  font-weight: 700;
  margin: 0;
}
.q-title.center {
  text-align: center;
}
.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  padding: 13px 16px;
  border-radius: 6px;
  border: 1px solid #c8a56b;
  background: rgba(250, 242, 220, 0.6);
  cursor: pointer;
  font-size: 14.5px;
  color: #4a3620;
  line-height: 1.6;
  transition: all 0.18s;
  width: 100%;
}
.opt-label {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1.5px solid #a52620;
  color: #a52620;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  transition: all 0.18s;
}
.opt-text {
  flex: 1 1 auto;
  min-width: 0;
  word-break: break-word;
  padding-top: 2px;
}
@media (hover: hover) {
  .option:hover {
    border-color: #a52620;
    background: rgba(165, 38, 32, 0.08);
  }
  .option:hover .opt-label {
    background: #a52620;
    color: #f6ead0;
  }
}
.option:active {
  transform: scale(0.99);
}
.quiz-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
.btn-prev {
  border: 1px solid #c8a56b;
  background: transparent;
  color: #6a4a28;
  font-size: 13.5px;
  cursor: pointer;
  padding: 7px 14px;
  border-radius: 6px;
}
.btn-prev:hover {
  border-color: #a52620;
  color: #a52620;
}
.answered-dot {
  font-size: 12px;
  color: #8a7060;
  background: rgba(165, 38, 32, 0.1);
  padding: 4px 12px;
  border-radius: 999px;
}

/* ---------- 匹配中 ---------- */
.matching-page { margin-top: 12vh; }
.matching-card { text-align: center; padding: 50px 34px; }
.matching-loader { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
.dot { width: 13px; height: 13px; border-radius: 50%; background: #a52620; animation: bounce 1s infinite ease-in-out; }
.dot.d2 { background: #c0392b; animation-delay: 0.15s; }
.dot.d3 { background: #8a5a2b; animation-delay: 0.3s; }
@keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(-10px); opacity: 1; } }
.matching-title { font-size: 19px; font-weight: 700; color: #5c1e12; margin: 0 0 6px; font-family: 'KaiTi', serif; }
.matching-sub { font-size: 13.5px; color: #8a7060; margin: 0; }

/* ---------- 结果 ---------- */
.result-wrap { margin-top: 2vh; }
.result-hero { text-align: center; }
.result-badge {
  display: inline-block;
  margin: 0 auto 12px;
  padding: 7px 16px;
  border-radius: 4px;
  background: linear-gradient(135deg, #b8860b, #daa520);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 3px 10px rgba(184, 134, 11, 0.4);
}
.result-diff {
  color: #8a7060;
  font-size: 13px;
  margin: 4px 0 12px;
}
.lowconf-card {
  border-left: 3px solid #a52620;
}
.result-tag {
  display: inline-block;
  background: linear-gradient(135deg, #a52620, #c0392b);
  color: #f6ead0;
  font-size: 14px;
  padding: 6px 18px;
  border-radius: 4px;
  margin-bottom: 12px;
  letter-spacing: 0.06em;
}
.result-score { margin: 8px auto 12px; display: flex; align-items: baseline; justify-content: center; gap: 6px; }
.score-num {
  font-size: 44px;
  font-weight: 900;
  line-height: 1;
  color: #a52620;
}
.score-unit { font-size: 14px; font-weight: 700; color: #8a7060; }
.result-one-liner {
  color: #4a3620;
  font-size: 15px;
  line-height: 1.9;
  max-width: 520px;
  margin: 0 auto 14px;
}
.result-meta { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.meta-chip {
  font-size: 12.5px;
  color: #6a4a28;
  background: rgba(160, 40, 30, 0.06);
  border: 1px solid #d4b585;
  padding: 5px 12px;
  border-radius: 4px;
}
.sec-title {
  color: #5c1e12;
  font-size: 16px;
  font-weight: 700;
  margin: 18px 0 8px;
  padding-left: 10px;
  border-left: 3px solid #a52620;
  font-family: 'KaiTi', serif;
}
.sec-title:first-child { margin-top: 0; }
.analysis-text {
  color: #4a3620;
  font-size: 14px;
  line-height: 1.9;
  margin: 0 0 8px;
}
.analysis-text.advice {
  color: #5c1e12;
  font-weight: 700;
  background: rgba(160, 40, 30, 0.05);
  border-left: 3px solid #a52620;
  padding: 10px 14px;
  border-radius: 4px;
}

/* 简版 Top3 */
.short-hint {
  text-align: center;
  color: #8a7060;
  font-size: 13px;
  margin: 0 0 16px;
}
.top3-grid { display: flex; gap: 12px; margin-bottom: 18px; }
.top3-card {
  flex: 1;
  text-align: center;
  padding: 16px 10px;
  border: 1.5px solid var(--c, #a52620);
  border-radius: 6px;
  background: rgba(250, 242, 220, 0.6);
  position: relative;
}
.top3-card.first {
  background: rgba(160, 40, 30, 0.08);
  box-shadow: 0 4px 14px rgba(160, 40, 30, 0.15);
}
.top3-rank {
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 12px;
  color: #8a7060;
  font-weight: 700;
}
.top3-name { font-size: 18px; font-weight: 700; color: var(--c, #5c1e12); font-family: 'KaiTi', serif; }
.top3-percent { font-size: 14px; color: #8a7060; margin-top: 4px; }
.btn-full {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #a52620;
  border-radius: 6px;
  background: transparent;
  color: #a52620;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'KaiTi', serif;
}
.btn-full:hover { background: rgba(160, 40, 30, 0.08); }

/* 关系 */
.relation-row { display: flex; gap: 14px; margin-bottom: 12px; }
.rel-item { flex: 1; padding: 12px 14px; border: 1px solid #d4b585; border-radius: 6px; background: rgba(250, 242, 220, 0.6); }
.rel-label { display: block; font-size: 12px; color: #8a7060; margin-bottom: 4px; }
.rel-val { font-size: 14.5px; font-weight: 700; color: #5c1e12; }
.relation-line {
  text-align: center;
  color: #a52620;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  font-family: 'KaiTi', serif;
}

/* 排行 */
.rank-list { display: flex; flex-direction: column; gap: 10px; }
.rank-item { display: flex; align-items: center; gap: 12px; }
.rank-item.top .rank-name { font-weight: 900; transform: scale(1.08); }
.rank-no {
  flex-shrink: 0;
  width: 24px; height: 24px;
  border-radius: 4px;
  background: rgba(160, 40, 30, 0.1);
  color: #6a4a28;
  font-weight: 700;
  font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}
.rank-item.top .rank-no { background: linear-gradient(135deg, #a52620, #c0392b); color: #f6ead0; }
.rank-name { flex-shrink: 0; width: 64px; font-size: 14px; font-weight: 700; }
.rank-bar { flex: 1; height: 12px; border-radius: 999px; background: rgba(160, 40, 30, 0.1); overflow: hidden; }
.rank-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.rank-percent { flex-shrink: 0; width: 44px; text-align: right; font-size: 13px; font-weight: 700; color: #6a4a28; }

.ref-list { margin: 0; padding-left: 20px; color: #5a4430; font-size: 12.5px; line-height: 1.8; }
.result-actions { text-align: center; margin-top: 8px; }
.btn-restart {
  padding: 12px 36px;
  border: 1.5px solid #a52620;
  border-radius: 6px;
  background: linear-gradient(135deg, #a52620, #c0392b);
  color: #f6ead0;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(160, 40, 30, 0.25);
  transition: transform 0.2s;
  font-family: 'KaiTi', serif;
}
.btn-restart:hover { transform: translateY(-2px); }

/* ---------- 弹幕 ---------- */
.danmaku-layer {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none; z-index: 0; overflow: hidden;
}
.danmaku {
  position: absolute; left: 0;
  transform: translateX(-110%);
  white-space: nowrap;
  font-size: 14px; font-weight: 600;
  color: var(--dcolor, #a52620);
  background: rgba(250, 242, 220, 0.85);
  border: 1.5px solid var(--dcolor, #a52620);
  padding: 6px 14px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(60, 40, 20, 0.12);
  opacity: 0.88;
  animation: danmaku-move linear forwards;
}
.danmaku-name { font-weight: 800; }
@keyframes danmaku-move {
  from { transform: translateX(-110%); }
  to { transform: translateX(calc(100vw + 60px)); }
}
.danmaku-enter-active, .danmaku-leave-active { transition: all 0.3s ease; }
.danmaku-leave-to { opacity: 0; transform: scale(0.8); }

/* transition */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(24px); }

@media (max-width: 560px) {
  .app { padding: 18px 12px 48px; }
  .scroll-body { padding: 16px 20px 22px; }
  .scroll-top { padding: 18px 22px 6px; }
  .scroll-top.mini { padding: 14px 20px 12px; }
  .mode-buttons { flex-direction: column; }
  .title { font-size: 24px; }
  .top3-grid { flex-direction: column; }
  .relation-row { flex-direction: column; }
  .danmaku { font-size: 12px; padding: 5px 10px; }
}
</style>
