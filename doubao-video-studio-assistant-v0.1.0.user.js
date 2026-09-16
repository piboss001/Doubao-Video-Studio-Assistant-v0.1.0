// ==UserScript==
// @name         Doubao Video Studio Assistant
// @namespace    https://github.com/piboss001/doubao-Video-Studio-Assistant-v0.1.0
// @version      0.1.1
// @description  豆包 AI 短视频提示词工作流助手：角色/Hook/场景切换、固定规则、历史记录、一键填入豆包。
// @author       piboss001
// @match        https://www.doubao.com/*
// @match        https://doubao.com/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @updateURL    https://raw.githubusercontent.com/piboss001/doubao-Video-Studio-Assistant-v0.1.0/main/doubao-video-studio-assistant-v0.1.0.user.js
// @downloadURL  https://raw.githubusercontent.com/piboss001/doubao-Video-Studio-Assistant-v0.1.0/main/doubao-video-studio-assistant-v0.1.0.user.js
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.1.1';
  const PREFIX = 'dvsa';
  const STORE_CONFIG = 'dvsa_config_v1';
  const STORE_HISTORY = 'dvsa_history_v1';

  const ROLE_ACTIONS = {
    '柯基': {
      observe: '柯基迅速锁定蚊子的飞行方向，身体压低准备爆发冲刺',
      chase: '柯基突然侧身冲刺，快速提前切入蚊子的飞行路线',
      attack: '柯基急停转身，前爪稳定握住 S1 电蚊拍，精准横向挥拍',
      finish: '柯基稳稳落地，回头确认宝宝安全，神情得意又可爱'
    },
    '兔子': {
      observe: '兔子竖起耳朵，迅速锁定蚊子的移动轨迹，身体微微下蹲蓄力',
      chase: '兔子连续两次快速弹跳，利用空中位移追到蚊子侧前方',
      attack: '兔子在空中轻巧转身，双爪握住 S1 电蚊拍完成精准截击',
      finish: '兔子轻盈落地，耳朵恢复放松，守在宝宝身边'
    },
    '企鹅': {
      observe: '企鹅冷静盯住蚊子的飞行轨迹，身体微微前倾准备移动',
      chase: '企鹅突然横向快速滑步，提前移动到蚊子的飞行路线前方，再进行第二次短距离滑步修正位置',
      attack: '企鹅在滑步末端稳住身体，双翅握住 S1 电蚊拍快速横扫命中',
      finish: '企鹅稳稳停下，回头看向宝宝，露出冷静又可靠的表情'
    },
    '仓鼠': {
      observe: '仓鼠瞪大眼睛锁定蚊子，快速抱紧身体准备移动',
      chase: '仓鼠沿床边快速翻滚前进，在蚊子改变方向前抢先到达',
      attack: '仓鼠突然起身，双爪高举 S1 电蚊拍快速向前拍击',
      finish: '仓鼠抱着电蚊拍站在宝宝旁边，神情认真又呆萌'
    },
    '博美': {
      observe: '博美耳朵立起，迅速捕捉蚊子的方向，前爪压低准备冲刺',
      chase: '博美用短距离爆发冲刺追上蚊子，并快速回身调整攻击角度',
      attack: '博美回身挥动 S1 电蚊拍，在蚊子靠近宝宝前精准命中',
      finish: '博美摇着尾巴守在宝宝旁边，确认危险已经解除'
    },
    '布偶猫': {
      observe: '布偶猫压低身体，眼睛紧紧跟随蚊子，进入捕猎姿态',
      chase: '布偶猫低姿快速冲刺，随后跃起截住蚊子的移动路线',
      attack: '布偶猫在跃起瞬间挥动 S1 电蚊拍，精准击中蚊子',
      finish: '布偶猫轻巧落地，坐到宝宝旁边安静守护'
    },
    '缅因猫': {
      observe: '缅因猫迅速转头锁定蚊子，身体前倾，准备大步扑击',
      chase: '缅因猫用两次大步移动快速逼近蚊子并封住飞行路线',
      attack: '缅因猫用 S1 电蚊拍完成有力但精准的横向扫击',
      finish: '缅因猫稳稳站在宝宝身边，像大型守卫一样观察四周'
    },
    '橘猫': {
      observe: '橘猫突然警觉，瞳孔锁定蚊子，前爪微微抬起准备行动',
      chase: '橘猫快速窜到宝宝旁边，连续调整两次位置追踪蚊子',
      attack: '橘猫双爪握住 S1 电蚊拍快速挥击，在最后一刻命中',
      finish: '橘猫坐在宝宝旁边，露出松了一口气又有点得意的表情'
    }
  };

  const HOOKS = [
    '蚊子已经逼近宝宝脸部，距离很近，马上准备叮咬',
    '蚊子已经停在宝宝手臂上方，正在准备落下',
    '蚊子从窗户方向高速飞入，直冲宝宝',
    '蚊子绕到宝宝耳边快速盘旋，距离越来越近',
    '蚊子从宝宝背后突然出现，马上接近宝宝脸侧'
  ];

  const SCENES = [
    '温暖整洁的婴儿卧室，夜晚柔和环境光',
    '现代简洁的客厅，宝宝躺在柔软地垫上',
    '安静的卧室床边，暖色夜灯已经关闭，只保留自然暗光',
    '露营帐篷内部，夜晚环境，空间紧凑但画面干净'
  ];

  const PRODUCTS = [
    'Qualitell S1 电蚊拍',
    'Qualitell S1 Pro 电蚊拍'
  ];

  const DEFAULT_CONFIG = {
    mode: '同结构换角色',
    role: '企鹅',
    hookIndex: 0,
    sceneIndex: 0,
    product: PRODUCTS[0],
    duration: 10,
    ratio: '9:16',
    extra: ''
  };

  let config = {
    ...DEFAULT_CONFIG,
    ...(GM_getValue(STORE_CONFIG, {}) || {})
  };

  let history = GM_getValue(STORE_HISTORY, []);

  if (!Array.isArray(history)) {
    history = [];
  }

  let panelOpen = false;
  let currentPrompt = '';

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  function saveConfig() {
    GM_setValue(STORE_CONFIG, config);
  }

  function saveHistory() {
    history = history.slice(0, 30);
    GM_setValue(STORE_HISTORY, history);
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  function toast(text) {
    let el = document.getElementById(`${PREFIX}-toast`);

    if (!el) {
      el = document.createElement('div');
      el.id = `${PREFIX}-toast`;
      document.documentElement.appendChild(el);
    }

    el.textContent = text;

    clearTimeout(toast._timer);

    toast._timer = setTimeout(
      () => el.remove(),
      2200
    );
  }

  function getRoleActions() {
    return (
      ROLE_ACTIONS[config.role] ||
      ROLE_ACTIONS['企鹅']
    );
  }

  function getHook() {
    return (
      HOOKS[Number(config.hookIndex) || 0] ||
      HOOKS[0]
    );
  }

  function getScene() {
    return (
      SCENES[Number(config.sceneIndex) || 0] ||
      SCENES[0]
    );
  }

  function buildPrompt() {
    const a = getRoleActions();
    const hook = getHook();
    const scene = getScene();
    const product = config.product;

    return `请生成一条 ${config.duration} 秒、${config.ratio} 竖屏、萌系高质量 3D 动画短视频。

【项目】
萌宠宇宙：${config.role} 使用 ${product} 保护宝宝免受蚊子叮咬。

【场景】
${scene}。画面干净、主体明确、镜头节奏快，不要复杂背景，不要新增无关角色。

【固定角色】
1. 宝宝：可爱、自然，全程外形一致。
2. ${config.role}：萌系 3D 角色，全程体型、毛色、脸部、服装和比例保持一致。
3. 蚊子：体型清晰可见，但不要过度放大或恐怖化。
4. ${product}：外形、颜色、比例、网面结构全程保持一致，不允许产品变形。

【0–1 秒｜强 Hook】
完整第一帧同时出现宝宝、${config.role}、蚊子和 ${product}。
${hook}。
${config.role} 已经发现危险，观众第一秒就能理解“宝宝马上会被蚊子叮”。

【1–2 秒｜危险升级】
镜头快速推近宝宝和蚊子，突出蚊子马上准备叮咬。
${a.observe}。

【2–4 秒｜快速追击】
蚊子突然改变飞行方向。
${a.chase}。
镜头快速切换，保持动作清楚，不要拖慢节奏。

【4–5 秒｜拿起产品】
${config.role} 快速拿起 ${product}。
产品必须保持真实、完整、清晰，不能变成其他武器或发生结构变化。
电蚊拍网面出现轻微紫色电击光效。

【5–8 秒｜高潮击中】
${a.attack}。
5–8 秒必须出现最明确的高潮：蚊子与电蚊拍网面接触，出现短促、清晰的紫色电弧，蚊子被击中并迅速坠落。
动作必须连贯、快速、有力量感，但整体保持萌系风格。

【8–9 秒｜危险解除】
蚊子落下，宝宝保持安全，没有被叮咬。
${config.role} 停止追击并确认周围已经安全。

【9–10 秒｜结尾】
${a.finish}。
最后 1 秒画面保持稳定，可以形成自然循环感，不要突然黑屏或切断。

【画面与一致性要求】
- ${config.duration} 秒完整故事，前 1 秒必须直接出现危险。
- ${config.ratio}，适合 TikTok / Reels / Shorts。
- 萌系高质量 3D 动画，清晰、自然、干净。
- 宝宝、${config.role}、蚊子、${product} 从头到尾外形一致。
- 产品不能变形、不能变色、不能增加零件、不能变成普通球拍或其他物品。
- 不允许新增角色。
- 不允许多余肢体、手脚穿模、角色融合、产品穿模。
- 不要乱码、字幕、水印、Logo 漂移、伪文字。
- 不要四宫格、拼图、多场景拼接。
- 不要杂乱光斑、AI 噪点、低清晰度、边缘毛刺。
- 蚊子运动轨迹要清楚，动物的视线和动作必须跟随蚊子。
- 5–8 秒必须有明确“击中蚊子”的动作高潮。${
      config.extra
        ? `\n\n【本条额外要求】\n${config.extra.trim()}`
        : ''
    }`;
  }

  function generatePrompt(addToHistory = true) {
    currentPrompt = buildPrompt();

    const preview =
      $(`#${PREFIX}-preview`);

    if (preview) {
      preview.value = currentPrompt;
    }

    if (addToHistory) {
      history.unshift({
        id: Date.now(),
        time: new Date().toLocaleString(),
        role: config.role,
        mode: config.mode,
        hook: getHook(),
        prompt: currentPrompt
      });

      saveHistory();
      renderHistory();
    }

    return currentPrompt;
  }

  function nextVariant() {
    if (
      config.mode ===
      '同结构换角色'
    ) {
      const roles =
        Object.keys(ROLE_ACTIONS);

      const index =
        roles.indexOf(config.role);

      config.role =
        roles[
          (index + 1) %
          roles.length
        ];
    }
    else {
      config.hookIndex =
        (
          Number(config.hookIndex) +
          1
        ) %
        HOOKS.length;
    }

    saveConfig();
    syncControls();
    generatePrompt(false);
  }

  function prevVariant() {
    if (
      config.mode ===
      '同结构换角色'
    ) {
      const roles =
        Object.keys(ROLE_ACTIONS);

      const index =
        roles.indexOf(config.role);

      config.role =
        roles[
          (
            index -
            1 +
            roles.length
          ) %
          roles.length
        ];
    }
    else {
      config.hookIndex =
        (
          Number(config.hookIndex) -
          1 +
          HOOKS.length
        ) %
        HOOKS.length;
    }

    saveConfig();
    syncControls();
    generatePrompt(false);
  }

  async function copyPrompt() {
    const text =
      currentPrompt ||
      generatePrompt(false);

    try {
      await navigator.clipboard.writeText(text);
      toast('提示词已复制');
    }
    catch (_) {
      const ta =
        document.createElement('textarea');

      ta.value = text;

      document.body.appendChild(ta);

      ta.select();

      document.execCommand('copy');

      ta.remove();

      toast('提示词已复制');
    }
  }

  function isVisible(el) {
    if (!el) {
      return false;
    }

    const r =
      el.getBoundingClientRect();

    const s =
      getComputedStyle(el);

    return (
      r.width > 120 &&
      r.height > 22 &&
      s.visibility !== 'hidden' &&
      s.display !== 'none'
    );
  }

  function findDoubaoEditor() {
    const selectors = [
      'textarea[placeholder*="描述"]',
      'textarea[placeholder*="发送"]',
      'textarea[placeholder*="输入"]',
      '.ProseMirror[contenteditable="true"]',
      '[data-slate-editor="true"][contenteditable="true"]',
      '[contenteditable="true"]',
      'textarea'
    ];

    const candidates = [];

    for (
      const selector
      of selectors
    ) {
      document
        .querySelectorAll(selector)
        .forEach(el => {

          if (!isVisible(el)) {
            return;
          }

          if (
            el.closest(
              `#${PREFIX}-panel`
            )
          ) {
            return;
          }

          const r =
            el.getBoundingClientRect();

          const bottomBonus =
            r.top >
            innerHeight * 0.45
              ? 1500
              : 0;

          const widthBonus =
            Math.min(
              r.width,
              1000
            );

          const score =
            r.bottom +
            bottomBonus +
            widthBonus;

          candidates.push({
            el,
            score
          });
        });
    }

    candidates.sort(
      (a, b) =>
        b.score -
        a.score
    );

    return (
      candidates[0]?.el ||
      null
    );
  }

  function setTextareaValue(
    el,
    text
  ) {
    const proto =
      el.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;

    const setter =
      Object
        .getOwnPropertyDescriptor(
          proto,
          'value'
        )
        ?.set;

    if (setter) {
      setter.call(
        el,
        text
      );
    }
    else {
      el.value = text;
    }

    el.dispatchEvent(
      new Event(
        'input',
        {
          bubbles: true
        }
      )
    );

    el.dispatchEvent(
      new Event(
        'change',
        {
          bubbles: true
        }
      )
    );
  }

  function setEditableValue(
    el,
    text
  ) {
    el.focus();

    let inserted =
      false;

    try {
      const selection =
        window.getSelection();

      const range =
        document.createRange();

      range.selectNodeContents(el);

      selection.removeAllRanges();

      selection.addRange(range);

      inserted =
        document.execCommand(
          'insertText',
          false,
          text
        );
    }
    catch (_) {}

    if (
      !inserted ||
      !el.innerText?.includes(
        text.slice(0, 20)
      )
    ) {
      el.innerHTML = '';

      const p =
        document.createElement('p');

      p.textContent =
        text;

      el.appendChild(p);
    }

    try {
      el.dispatchEvent(
        new InputEvent(
          'input',
          {
            bubbles: true,
            inputType: 'insertText',
            data: text
          }
        )
      );
    }
    catch (_) {
      el.dispatchEvent(
        new Event(
          'input',
          {
            bubbles: true
          }
        )
      );
    }
  }

  async function fillDoubao() {
    const text =
      currentPrompt ||
      generatePrompt(false);

    const editor =
      findDoubaoEditor();

    if (!editor) {
      await copyPrompt();

      toast(
        '未找到豆包输入框，已复制提示词'
      );

      return false;
    }

    try {
      editor.focus();

      if (
        editor.matches(
          'textarea,input'
        )
      ) {
        setTextareaValue(
          editor,
          text
        );
      }
      else {
        setEditableValue(
          editor,
          text
        );
      }

      editor.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });

      toast(
        '已填入豆包输入框'
      );

      return true;
    }
    catch (error) {
      console.warn(
        '[DVSA] fill failed',
        error
      );

      await copyPrompt();

      toast(
        '自动填入失败，已复制提示词'
      );

      return false;
    }
  }

  function syncControls() {
    const set =
      (id, value) => {
        const el =
          document.getElementById(id);

        if (el) {
          el.value =
            String(value);
        }
      };

    set(
      `${PREFIX}-mode`,
      config.mode
    );

    set(
      `${PREFIX}-role`,
      config.role
    );

    set(
      `${PREFIX}-hook`,
      config.hookIndex
    );

    set(
      `${PREFIX}-scene`,
      config.sceneIndex
    );

    set(
      `${PREFIX}-product`,
      config.product
    );

    const extra =
      $(`#${PREFIX}-extra`);

    if (extra) {
      extra.value =
        config.extra || '';
    }
  }

  function renderHistory() {
    const root =
      $(`#${PREFIX}-history`);

    if (!root) {
      return;
    }

    root.innerHTML = '';

    if (!history.length) {
      root.innerHTML =
        '<div class="dvsa-empty">暂无历史提示词</div>';

      return;
    }

    history
      .slice(0, 10)
      .forEach(item => {

        const row =
          document.createElement(
            'div'
          );

        row.className =
          'dvsa-history-row';

        const meta =
          document.createElement(
            'div'
          );

        meta.className =
          'dvsa-history-meta';

        meta.innerHTML =
          `<b>${escapeHtml(item.role)}</b>` +
          `<span>${escapeHtml(item.mode)}</span>` +
          `<small>${escapeHtml(item.time)}</small>`;

        const actions =
          document.createElement(
            'div'
          );

        actions.className =
          'dvsa-history-actions';

        const restore =
          document.createElement(
            'button'
          );

        restore.textContent =
          '恢复';

        restore.onclick =
          () => {

            currentPrompt =
              item.prompt;

            const preview =
              $(`#${PREFIX}-preview`);

            if (preview) {
              preview.value =
                item.prompt;
            }

            toast(
              '已恢复历史提示词'
            );
          };

        const copy =
          document.createElement(
            'button'
          );

        copy.textContent =
          '复制';

        copy.onclick =
          async () => {

            currentPrompt =
              item.prompt;

            await copyPrompt();
          };

        actions.append(
          restore,
          copy
        );

        row.append(
          meta,
          actions
        );

        root.appendChild(
          row
        );
      });
  }

  function installStyle() {
    if (
      $(`#${PREFIX}-style`)
    ) {
      return;
    }

    const style =
      document.createElement(
        'style'
      );

    style.id =
      `${PREFIX}-style`;

    style.textContent = `
#${PREFIX}-fab{
position:fixed!important;
right:78px!important;
bottom:96px!important;
z-index:2147483644!important;
width:48px!important;
height:48px!important;
border:0!important;
border-radius:14px!important;
background:#fff!important;
color:#111!important;
box-shadow:0 8px 30px rgba(0,0,0,.18)!important;
cursor:pointer!important;
font-size:21px!important;
}

#${PREFIX}-panel{
position:fixed!important;
right:78px!important;
bottom:154px!important;
z-index:2147483645!important;
width:420px!important;
max-height:78vh!important;
background:#fff!important;
color:#18181b!important;
border:1px solid #e9e9eb!important;
border-radius:16px!important;
box-shadow:0 18px 55px rgba(0,0,0,.18)!important;
overflow:hidden!important;
font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif!important;
}

#${PREFIX}-panel[hidden]{
display:none!important;
}

.dvsa-head{
height:52px;
padding:0 15px;
display:flex;
align-items:center;
justify-content:space-between;
border-bottom:1px solid #eee;
}

.dvsa-title{
font-size:15px;
font-weight:700;
}

.dvsa-ver{
font-size:11px;
color:#999;
font-weight:400;
margin-left:4px;
}

.dvsa-close{
border:0;
background:transparent;
font-size:18px;
cursor:pointer;
color:#777;
}

.dvsa-scroll{
max-height:calc(78vh - 52px);
overflow:auto;
padding:12px;
}

.dvsa-grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:9px;
}

.dvsa-field{
display:flex;
flex-direction:column;
gap:5px;
margin-bottom:9px;
}

.dvsa-field.full{
grid-column:1/-1;
}

.dvsa-field label{
font-size:11px;
color:#777;
}

.dvsa-field select,
.dvsa-field textarea{
width:100%;
box-sizing:border-box;
border:1px solid #e1e1e4;
border-radius:8px;
background:#fff;
color:#222;
padding:8px 9px;
font:12px/1.45 inherit;
outline:none;
}

.dvsa-field textarea{
resize:vertical;
min-height:58px;
}

.dvsa-section-title{
margin:10px 0 8px;
font-size:12px;
font-weight:700;
color:#555;
}

.dvsa-actions{
display:grid;
grid-template-columns:1fr 1fr;
gap:8px;
margin:10px 0;
}

.dvsa-btn{
border:0;
border-radius:9px;
padding:9px 10px;
cursor:pointer;
font:600 12px/1 inherit;
}

.dvsa-primary{
background:#18181b;
color:#fff;
}

.dvsa-light{
background:#f2f2f4;
color:#222;
}

.dvsa-nav{
display:grid;
grid-template-columns:1fr 1fr;
gap:8px;
margin-bottom:10px;
}

#${PREFIX}-preview{
min-height:230px;
font-size:11px;
line-height:1.55;
}

.dvsa-tip{
padding:8px 9px;
border-radius:8px;
background:#f7f7f8;
color:#777;
font-size:11px;
line-height:1.55;
margin-bottom:10px;
}

.dvsa-history-row{
display:flex;
align-items:center;
justify-content:space-between;
gap:8px;
padding:8px;
border-bottom:1px solid #f0f0f1;
}

.dvsa-history-meta{
min-width:0;
display:grid;
grid-template-columns:auto 1fr;
gap:2px 6px;
align-items:center;
}

.dvsa-history-meta b{
font-size:12px;
}

.dvsa-history-meta span{
font-size:11px;
color:#777;
white-space:nowrap;
overflow:hidden;
text-overflow:ellipsis;
}

.dvsa-history-meta small{
grid-column:1/-1;
color:#aaa;
font-size:9px;
}

.dvsa-history-actions{
display:flex;
gap:5px;
flex:none;
}

.dvsa-history-actions button{
border:0;
border-radius:6px;
background:#f1f1f2;
padding:5px 7px;
font-size:10px;
cursor:pointer;
}

.dvsa-empty{
text-align:center;
color:#aaa;
font-size:11px;
padding:15px;
}

#${PREFIX}-toast{
position:fixed;
left:50%;
bottom:75px;
transform:translateX(-50%);
z-index:2147483647;
background:rgba(0,0,0,.82);
color:#fff;
padding:9px 14px;
border-radius:9px;
font:13px/1.4 sans-serif;
pointer-events:none;
}
`;

    (
      document.head ||
      document.documentElement
    ).appendChild(style);
  }

  function options(
    items,
    selected
  ) {
    return items
      .map(
        item =>
          `<option value="${escapeHtml(item)}"${
            String(item) ===
            String(selected)
              ? ' selected'
              : ''
          }>${escapeHtml(item)}</option>`
      )
      .join('');
  }

  function createUI() {
    if (
      $(`#${PREFIX}-fab`)
    ) {
      return;
    }

    const fab =
      document.createElement(
        'button'
      );

    fab.id =
      `${PREFIX}-fab`;

    fab.type =
      'button';

    fab.textContent =
      '🎬';

    fab.title =
      '豆包视频生成助手';

    const panel =
      document.createElement(
        'div'
      );

    panel.id =
      `${PREFIX}-panel`;

    panel.hidden =
      true;

    panel.innerHTML = `
<div class="dvsa-head">

  <div class="dvsa-title">
    豆包视频生成助手
    <span class="dvsa-ver">
      v${VERSION}
    </span>
  </div>

  <button
    class="dvsa-close"
    id="${PREFIX}-close">
    ×
  </button>

</div>

<div class="dvsa-scroll">

  <div class="dvsa-tip">
    独立于无水印下载插件。这里负责：选角色 / Hook → 自动拼 10 秒脚本 → 一键填入豆包。
  </div>

  <div class="dvsa-grid">

    <div class="dvsa-field">
      <label>测试模式</label>

      <select id="${PREFIX}-mode">
        ${options(
          [
            '同结构换角色',
            '同角色换Hook',
            '自由调整'
          ],
          config.mode
        )}
      </select>
    </div>

    <div class="dvsa-field">
      <label>角色</label>

      <select id="${PREFIX}-role">
        ${options(
          Object.keys(
            ROLE_ACTIONS
          ),
          config.role
        )}
      </select>
    </div>

    <div class="dvsa-field full">
      <label>前 1 秒 Hook</label>

      <select id="${PREFIX}-hook">

        ${
          HOOKS
            .map(
              (text, index) =>
                `<option value="${index}"${
                  index ===
                  Number(
                    config.hookIndex
                  )
                    ? ' selected'
                    : ''
                }>${escapeHtml(text)}</option>`
            )
            .join('')
        }

      </select>
    </div>

    <div class="dvsa-field full">
      <label>场景</label>

      <select id="${PREFIX}-scene">

        ${
          SCENES
            .map(
              (text, index) =>
                `<option value="${index}"${
                  index ===
                  Number(
                    config.sceneIndex
                  )
                    ? ' selected'
                    : ''
                }>${escapeHtml(text)}</option>`
            )
            .join('')
        }

      </select>
    </div>

    <div class="dvsa-field full">
      <label>产品</label>

      <select id="${PREFIX}-product">
        ${options(
          PRODUCTS,
          config.product
        )}
      </select>
    </div>

    <div class="dvsa-field full">

      <label>
        本条额外要求（可留空）
      </label>

      <textarea
        id="${PREFIX}-extra"
        placeholder="例如：3–4秒必须连续两次横向滑步；最后一秒让企鹅回头看宝宝。">${escapeHtml(
          config.extra || ''
        )}</textarea>

    </div>

  </div>

  <div class="dvsa-nav">

    <button
      class="dvsa-btn dvsa-light"
      id="${PREFIX}-prev">
      ← 上一条
    </button>

    <button
      class="dvsa-btn dvsa-light"
      id="${PREFIX}-next">
      下一条 →
    </button>

  </div>

  <div class="dvsa-actions">

    <button
      class="dvsa-btn dvsa-primary"
      id="${PREFIX}-generate">
      生成提示词
    </button>

    <button
      class="dvsa-btn dvsa-primary"
      id="${PREFIX}-fill">
      填入豆包
    </button>

    <button
      class="dvsa-btn dvsa-light"
      id="${PREFIX}-copy">
      复制提示词
    </button>

    <button
      class="dvsa-btn dvsa-light"
      id="${PREFIX}-nextfill">
      下一条并填入
    </button>

  </div>

  <div class="dvsa-section-title">
    提示词预览
  </div>

  <div class="dvsa-field full">
    <textarea
      id="${PREFIX}-preview">
    </textarea>
  </div>

  <div class="dvsa-section-title">
    最近提示词
  </div>

  <div id="${PREFIX}-history">
  </div>

</div>
`;

    document
      .documentElement
      .append(
        fab,
        panel
      );

    fab.onclick =
      () => {

        panelOpen =
          !panelOpen;

        panel.hidden =
          !panelOpen;

        if (
          panelOpen &&
          !currentPrompt
        ) {
          generatePrompt(false);
        }
      };

    $(`#${PREFIX}-close`)
      .onclick =
      () => {

        panelOpen =
          false;

        panel.hidden =
          true;
      };

    const bind =
      (
        id,
        key,
        parser = value => value
      ) => {

        $(`#${PREFIX}-${id}`)
          .addEventListener(
            'change',
            event => {

              config[key] =
                parser(
                  event.target.value
                );

              saveConfig();

              generatePrompt(false);
            }
          );
      };

    bind(
      'mode',
      'mode'
    );

    bind(
      'role',
      'role'
    );

    bind(
      'hook',
      'hookIndex',
      Number
    );

    bind(
      'scene',
      'sceneIndex',
      Number
    );

    bind(
      'product',
      'product'
    );

    $(`#${PREFIX}-extra`)
      .addEventListener(
        'input',
        event => {

          config.extra =
            event.target.value;

          saveConfig();

          generatePrompt(false);
        }
      );

    $(`#${PREFIX}-generate`)
      .onclick =
      () => {

        generatePrompt(true);

        toast(
          '提示词已生成'
        );
      };

    $(`#${PREFIX}-fill`)
      .onclick =
      async () => {

        generatePrompt(false);

        await fillDoubao();
      };

    $(`#${PREFIX}-copy`)
      .onclick =
      copyPrompt;

    $(`#${PREFIX}-next`)
      .onclick =
      nextVariant;

    $(`#${PREFIX}-prev`)
      .onclick =
      prevVariant;

    $(`#${PREFIX}-nextfill`)
      .onclick =
      async () => {

        nextVariant();

        await fillDoubao();
      };

    generatePrompt(false);

    renderHistory();
  }

  function boot() {
    installStyle();

    createUI();

    console.log(
      `[DVSA] v${VERSION} loaded`
    );
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {
        once: true
      }
    );
  }
  else {
    boot();
  }
})();
