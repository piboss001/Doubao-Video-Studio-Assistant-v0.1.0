from pathlib import Path

code = r'''// ==UserScript==
// @name         Doubao Video Studio Assistant
// @namespace    https://github.com/piboss001/doubao-Video-Studio-Assistant-v0.1.0
// @version      0.3.0
// @description  豆包 AI 短视频工作流助手：自定义提示词、变量锁定、版本分支、任务状态、结果备注、批量测试矩阵、收藏、历史、跨浏览器当前配置复制导入。
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

  const VERSION = '0.3.0';
  const PREFIX = 'dvsa';

  const KEYS = {
    config: 'dvsa_config_v3',
    history: 'dvsa_history_v3',
    favorites: 'dvsa_favorites_v3',
    tasks: 'dvsa_tasks_v3',
    currentTask: 'dvsa_current_task_v3'
  };

  const STATUS_LIST = ['待生成', '生成中', '已生成', '已下载', '已发布', '废片'];

  const ROLE_PRESETS = {
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

  const HOOK_PRESETS = [
    '蚊子已经逼近宝宝脸部，距离很近，马上准备叮咬',
    '蚊子已经停在宝宝手臂上方，正在准备落下',
    '蚊子从窗户方向高速飞入，直冲宝宝',
    '蚊子绕到宝宝耳边快速盘旋，距离越来越近',
    '蚊子从宝宝背后突然出现，马上接近宝宝脸侧'
  ];

  const SCENE_PRESETS = [
    '温暖整洁的婴儿卧室，夜晚柔和环境光',
    '现代简洁的客厅，宝宝躺在柔软地垫上',
    '安静的卧室床边，暖色夜灯已经关闭，只保留自然暗光',
    '露营帐篷内部，夜晚环境，空间紧凑但画面干净'
  ];

  const PRODUCT_PRESETS = [
    'Qualitell S1 电蚊拍',
    'Qualitell S1 Pro 电蚊拍'
  ];

  const DEFAULT_CONFIG = {
    nextMode: '换角色，结构不变',
    role: '企鹅',
    hook: HOOK_PRESETS[0],
    scene: SCENE_PRESETS[0],
    product: PRODUCT_PRESETS[0],
    duration: 10,
    ratio: '9:16',
    observe: ROLE_PRESETS['企鹅'].observe,
    chase: ROLE_PRESETS['企鹅'].chase,
    attack: ROLE_PRESETS['企鹅'].attack,
    finish: ROLE_PRESETS['企鹅'].finish,
    extra: '',
    locks: {
      role: false,
      hook: false,
      scene: true,
      product: true
    }
  };

  let config = mergeConfig(DEFAULT_CONFIG, GM_getValue(KEYS.config, {}));
  let history = safeArray(GM_getValue(KEYS.history, []));
  let favorites = safeArray(GM_getValue(KEYS.favorites, []));
  let tasks = safeArray(GM_getValue(KEYS.tasks, []));
  let currentTaskId = GM_getValue(KEYS.currentTask, '');
  let currentPrompt = '';
  let panelOpen = false;
  let currentTab = 'generate';

  function safeArray(v) {
    return Array.isArray(v) ? v : [];
  }

  function mergeConfig(base, saved) {
    return {
      ...base,
      ...(saved || {}),
      locks: {
        ...base.locks,
        ...((saved || {}).locks || {})
      }
    };
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  const $ = (s, root = document) => root.querySelector(s);

  function saveAll() {
    GM_setValue(KEYS.config, config);
    GM_setValue(KEYS.history, history.slice(0, 50));
    GM_setValue(KEYS.favorites, favorites);
    GM_setValue(KEYS.tasks, tasks);
    GM_setValue(KEYS.currentTask, currentTaskId || '');
  }

  function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({
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
    toast._timer = setTimeout(() => el.remove(), 2300);
  }

  /* =========================================================
     Prompt
  ========================================================= */

  function buildPrompt() {
    return `请生成一条 ${config.duration} 秒、${config.ratio} 竖屏、萌系高质量 3D 动画短视频。

【项目】
萌宠宇宙：${config.role} 使用 ${config.product} 保护宝宝免受蚊子叮咬。

【场景】
${config.scene}。画面干净、主体明确、镜头节奏快，不要复杂背景，不要新增无关角色。

【固定角色】
1. 宝宝：可爱、自然，全程外形一致。
2. ${config.role}：萌系 3D 角色，全程体型、毛色、脸部、服装和比例保持一致。
3. 蚊子：体型清晰可见，但不要过度放大或恐怖化。
4. ${config.product}：外形、颜色、比例、网面结构全程保持一致，不允许产品变形。

【0–1 秒｜强 Hook】
完整第一帧同时出现宝宝、${config.role}、蚊子和 ${config.product}。
${config.hook}。
${config.role} 已经发现危险，观众第一秒就能理解“宝宝马上会被蚊子叮”。

【1–2 秒｜危险升级】
镜头快速推近宝宝和蚊子，突出蚊子马上准备叮咬。
${config.observe}。

【2–4 秒｜快速追击】
蚊子突然改变飞行方向。
${config.chase}。
镜头快速切换，保持动作清楚，不要拖慢节奏。

【4–5 秒｜拿起产品】
${config.role} 快速拿起 ${config.product}。
产品必须保持真实、完整、清晰，不能变成其他武器或发生结构变化。
电蚊拍网面出现轻微紫色电击光效。

【5–8 秒｜高潮击中】
${config.attack}。
5–8 秒必须出现最明确的高潮：蚊子与电蚊拍网面接触，出现短促、清晰的紫色电弧，蚊子被击中并迅速坠落。
动作必须连贯、快速、有力量感，但整体保持萌系风格。

【8–9 秒｜危险解除】
蚊子落下，宝宝保持安全，没有被叮咬。
${config.role} 停止追击并确认周围已经安全。

【9–10 秒｜结尾】
${config.finish}。
最后 1 秒画面保持稳定，可以形成自然循环感，不要突然黑屏或切断。

【画面与一致性要求】
- ${config.duration} 秒完整故事，前 1 秒必须直接出现危险。
- ${config.ratio}，适合 TikTok / Reels / Shorts。
- 萌系高质量 3D 动画，清晰、自然、干净。
- 宝宝、${config.role}、蚊子、${config.product} 从头到尾外形一致。
- 产品不能变形、不能变色、不能增加零件、不能变成普通球拍或其他物品。
- 不允许新增角色。
- 不允许多余肢体、手脚穿模、角色融合、产品穿模。
- 不要乱码、字幕、水印、Logo 漂移、伪文字。
- 不要四宫格、拼图、多场景拼接。
- 不要杂乱光斑、AI 噪点、低清晰度、边缘毛刺。
- 蚊子运动轨迹要清楚，动物的视线和动作必须跟随蚊子。
- 5–8 秒必须有明确“击中蚊子”的动作高潮。${config.extra ? `

【本条额外要求】
${config.extra.trim()}` : ''}`;
  }

  function getCurrentPrompt() {
    return $(`#${PREFIX}-preview`)?.value?.trim() || currentPrompt || buildPrompt();
  }

  function generatePrompt(addHistory = true) {
    currentPrompt = buildPrompt();
    const preview = $(`#${PREFIX}-preview`);
    if (preview) preview.value = currentPrompt;

    if (addHistory) {
      history.unshift({
        id: uid('h'),
        time: new Date().toLocaleString(),
        role: config.role,
        prompt: currentPrompt
      });
      history = history.slice(0, 50);
      saveAll();
      renderHistory();
    }
    return currentPrompt;
  }

  function applyRolePresetIfKnown(role) {
    const preset = ROLE_PRESETS[role];
    if (!preset) return;
    config.observe = preset.observe;
    config.chase = preset.chase;
    config.attack = preset.attack;
    config.finish = preset.finish;
  }

  /* =========================================================
     Variable locks + next variant
  ========================================================= */

  function toggleLock(key, checked) {
    config.locks[key] = !!checked;
    saveAll();
    renderLockState();
  }

  function renderLockState() {
    ['role', 'hook', 'scene', 'product'].forEach(key => {
      const check = $(`#${PREFIX}-lock-${key}`);
      const icon = $(`#${PREFIX}-locklabel-${key}`);
      if (check) check.checked = !!config.locks[key];
      if (icon) icon.textContent = config.locks[key] ? '🔒' : '🔓';
    });
  }

  function nextVariant(direction = 1) {
    if (config.nextMode === '换角色，结构不变') {
      if (config.locks.role) {
        toast('角色已锁定');
        return;
      }
      const roles = Object.keys(ROLE_PRESETS);
      let i = roles.indexOf(config.role);
      if (i < 0) i = 0;
      config.role = roles[(i + direction + roles.length) % roles.length];
      applyRolePresetIfKnown(config.role);
    } else if (config.nextMode === '角色不变，换前1秒Hook') {
      if (config.locks.hook) {
        toast('Hook 已锁定');
        return;
      }
      let i = HOOK_PRESETS.indexOf(config.hook);
      if (i < 0) i = 0;
      config.hook = HOOK_PRESETS[(i + direction + HOOK_PRESETS.length) % HOOK_PRESETS.length];
    } else {
      toast('手动调整模式不自动修改内容');
      return;
    }

    saveAll();
    syncControls();
    generatePrompt(false);
  }

  /* =========================================================
     Tasks / versions
  ========================================================= */

  function currentTask() {
    return tasks.find(t => t.id === currentTaskId) || null;
  }

  function rootIdOf(task) {
    return task?.rootId || task?.id || '';
  }

  function nextVersionNo(rootId) {
    const nums = tasks
      .filter(t => rootIdOf(t) === rootId)
      .map(t => Number(t.versionNo) || 1);
    return nums.length ? Math.max(...nums) + 1 : 1;
  }

  function saveAsTask() {
    const task = {
      id: uid('task'),
      rootId: '',
      parentId: '',
      versionNo: 1,
      name: `${config.role} · ${config.hook.slice(0, 12)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: '待生成',
      resultNote: '',
      config: clone(config),
      prompt: getCurrentPrompt()
    };
    task.rootId = task.id;

    tasks.unshift(task);
    currentTaskId = task.id;
    saveAll();
    renderTasks();
    updateCurrentTaskBar();
    toast('已保存为任务 V1');
  }

  function createVersionBranchFrom(taskId = currentTaskId) {
    const parent = tasks.find(t => t.id === taskId);
    if (!parent) {
      saveAsTask();
      return;
    }

    const rootId = rootIdOf(parent);
    const versionNo = nextVersionNo(rootId);

    const task = {
      id: uid('task'),
      rootId,
      parentId: parent.id,
      versionNo,
      name: `${config.role} · ${config.hook.slice(0, 12)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: '待生成',
      resultNote: '',
      config: clone(config),
      prompt: getCurrentPrompt()
    };

    tasks.unshift(task);
    currentTaskId = task.id;
    saveAll();
    renderTasks();
    updateCurrentTaskBar();
    toast(`已创建 V${versionNo}`);
  }

  function updateCurrentTask() {
    const task = currentTask();
    if (!task) {
      toast('当前没有任务，先保存为任务');
      return;
    }

    task.config = clone(config);
    task.prompt = getCurrentPrompt();
    task.name = `${config.role} · ${config.hook.slice(0, 12)}`;
    task.updatedAt = Date.now();
    saveAll();
    renderTasks();
    updateCurrentTaskBar();
    toast(`V${task.versionNo} 已更新`);
  }

  function loadTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentTaskId = task.id;
    config = mergeConfig(DEFAULT_CONFIG, task.config || {});
    currentPrompt = task.prompt || buildPrompt();
    saveAll();

    syncControls();
    const preview = $(`#${PREFIX}-preview`);
    if (preview) preview.value = currentPrompt;

    updateCurrentTaskBar();
    renderTasks();
    switchTab('generate');
    toast(`已载入 V${task.versionNo}`);
  }

  function setTaskStatus(taskId, status) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = status;
    task.updatedAt = Date.now();
    saveAll();
    updateCurrentTaskBar();
  }

  function setTaskNote(taskId, note) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    task.resultNote = note;
    task.updatedAt = Date.now();
    saveAll();
    updateCurrentTaskBar();
  }

  function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!confirm(`确认删除 V${task.versionNo}？`)) return;

    tasks = tasks.filter(t => t.id !== taskId);
    if (currentTaskId === taskId) currentTaskId = '';
    saveAll();
    renderTasks();
    updateCurrentTaskBar();
  }

  /* =========================================================
     Batch matrix
  ========================================================= */

  function createMatrixTasks() {
    const roleChecks = [...document.querySelectorAll(`#${PREFIX}-matrix-roles input:checked`)].map(x => x.value);
    const hookChecks = [...document.querySelectorAll(`#${PREFIX}-matrix-hooks input:checked`)].map(x => x.value);

    if (!roleChecks.length || !hookChecks.length) {
      toast('至少选择 1 个角色和 1 个 Hook');
      return;
    }

    const total = roleChecks.length * hookChecks.length;
    if (total > 30 && !confirm(`将创建 ${total} 个任务，继续吗？`)) return;

    const now = Date.now();
    const newTasks = [];

    roleChecks.forEach(role => {
      hookChecks.forEach(hook => {
        const c = clone(config);
        c.role = role;
        c.hook = hook;
        const preset = ROLE_PRESETS[role];
        if (preset) {
          c.observe = preset.observe;
          c.chase = preset.chase;
          c.attack = preset.attack;
          c.finish = preset.finish;
        }

        const oldConfig = config;
        config = c;
        const prompt = buildPrompt();
        config = oldConfig;

        const task = {
          id: uid('task'),
          rootId: '',
          parentId: '',
          versionNo: 1,
          name: `${role} · ${hook.slice(0, 12)}`,
          createdAt: now,
          updatedAt: now,
          status: '待生成',
          resultNote: '',
          config: c,
          prompt
        };
        task.rootId = task.id;
        newTasks.push(task);
      });
    });

    tasks = [...newTasks, ...tasks];
    saveAll();
    renderTasks();
    toast(`已创建 ${newTasks.length} 个测试任务`);
  }

  /* =========================================================
     Favorites
  ========================================================= */

  function addFavorite() {
    const name = prompt('收藏名称：', `${config.role} · ${config.hook.slice(0, 12)}`);
    if (!name?.trim()) return;

    const note = prompt('备注（可留空）：', '') || '';

    favorites.unshift({
      id: uid('fav'),
      name: name.trim(),
      note,
      createdAt: Date.now(),
      config: clone(config),
      prompt: getCurrentPrompt()
    });

    saveAll();
    renderFavorites();
    toast('已收藏');
  }

  function loadFavorite(id) {
    const fav = favorites.find(x => x.id === id);
    if (!fav) return;

    config = mergeConfig(DEFAULT_CONFIG, fav.config || {});
    currentPrompt = fav.prompt || buildPrompt();
    saveAll();

    syncControls();
    $(`#${PREFIX}-preview`).value = currentPrompt;
    switchTab('generate');
    toast('已载入收藏');
  }

  function editFavorite(id) {
    const fav = favorites.find(x => x.id === id);
    if (!fav) return;

    const name = prompt('收藏名称：', fav.name);
    if (!name?.trim()) return;

    const note = prompt('备注：', fav.note || '');
    fav.name = name.trim();
    fav.note = note || '';
    saveAll();
    renderFavorites();
  }

  function deleteFavorite(id) {
    const fav = favorites.find(x => x.id === id);
    if (!fav) return;
    if (!confirm(`确认删除收藏「${fav.name}」？`)) return;

    favorites = favorites.filter(x => x.id !== id);
    saveAll();
    renderFavorites();
    toast('收藏已删除');
  }

  /* =========================================================
     History
  ========================================================= */

  function clearHistory() {
    if (!confirm('确认清空全部历史记录？')) return;
    history = [];
    saveAll();
    renderHistory();
  }

  /* =========================================================
     Cross-browser current config
  ========================================================= */

  function encodeUnicode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  function decodeUnicode(str) {
    const binary = atob(str);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  async function copyCurrentConfig() {
    const task = currentTask();

    const payload = {
      format: 'DVSA_CURRENT',
      version: 1,
      config: clone(config),
      prompt: getCurrentPrompt(),
      task: task ? {
        versionNo: task.versionNo,
        status: task.status,
        resultNote: task.resultNote
      } : null
    };

    await copyText(`DVSA1:${encodeUnicode(JSON.stringify(payload))}`);
    toast('当前配置已复制');
  }

  function importCurrentConfig() {
    const raw = prompt('粘贴另一浏览器复制的 DVSA 配置码：', '');
    if (!raw) return;

    try {
      if (!raw.startsWith('DVSA1:')) throw new Error('配置码格式不正确');
      const payload = JSON.parse(decodeUnicode(raw.slice(6)));
      if (payload.format !== 'DVSA_CURRENT') throw new Error('不是 DVSA 当前配置');

      config = mergeConfig(DEFAULT_CONFIG, payload.config || {});
      currentPrompt = payload.prompt || buildPrompt();
      currentTaskId = '';
      saveAll();

      syncControls();
      $(`#${PREFIX}-preview`).value = currentPrompt;
      updateCurrentTaskBar();
      toast('当前配置导入成功');
    } catch (e) {
      alert(`导入失败：${e.message || e}`);
    }
  }

  /* =========================================================
     Clipboard + Doubao editor
  ========================================================= */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  async function copyPrompt() {
    await copyText(getCurrentPrompt());
    toast('提示词已复制');
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 120 && r.height > 22 && s.display !== 'none' && s.visibility !== 'hidden';
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

    const found = [];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!isVisible(el) || el.closest(`#${PREFIX}-panel`)) return;
        const r = el.getBoundingClientRect();
        const score = r.bottom + Math.min(r.width, 1000) + (r.top > innerHeight * 0.45 ? 1500 : 0);
        found.push({ el, score });
      });
    });

    found.sort((a, b) => b.score - a.score);
    return found[0]?.el || null;
  }

  function setNativeValue(el, text) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, text);
    else el.value = text;

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setEditableValue(el, text) {
    el.focus();
    let ok = false;

    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      ok = document.execCommand('insertText', false, text);
    } catch (_) {}

    if (!ok || !el.innerText?.includes(text.slice(0, 16))) {
      el.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = text;
      el.appendChild(p);
    }

    try {
      el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: text
      }));
    } catch (_) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async function fillDoubao() {
    const text = getCurrentPrompt();
    const editor = findDoubaoEditor();

    if (!editor) {
      await copyText(text);
      toast('没找到豆包输入框，已复制提示词');
      return;
    }

    if (editor.matches('textarea,input')) setNativeValue(editor, text);
    else setEditableValue(editor, text);

    editor.focus();
    toast('已填入豆包');
  }

  /* =========================================================
     Render helpers
  ========================================================= */

  function optionHTML(items, selected) {
    return items.map(item =>
      `<option value="${escapeHtml(item)}"${String(item) === String(selected) ? ' selected' : ''}>${escapeHtml(item)}</option>`
    ).join('');
  }

  function datalistHTML(id, items) {
    return `<datalist id="${id}">${items.map(x => `<option value="${escapeHtml(x)}"></option>`).join('')}</datalist>`;
  }

  function syncControls() {
    const values = {
      nextmode: config.nextMode,
      role: config.role,
      hook: config.hook,
      scene: config.scene,
      product: config.product,
      duration: config.duration,
      ratio: config.ratio,
      observe: config.observe,
      chase: config.chase,
      attack: config.attack,
      finish: config.finish,
      extra: config.extra
    };

    Object.entries(values).forEach(([key, value]) => {
      const el = $(`#${PREFIX}-${key}`);
      if (el) el.value = value ?? '';
    });

    renderLockState();
  }

  function updateCurrentTaskBar() {
    const box = $(`#${PREFIX}-current-task`);
    if (!box) return;

    const task = currentTask();

    if (!task) {
      box.innerHTML = `
        <div><b>当前未保存任务</b><small>调整好脚本后可保存为任务</small></div>
        <span class="dvsa-task-pill">—</span>`;
      return;
    }

    box.innerHTML = `
      <div>
        <b>${escapeHtml(task.name)} · V${task.versionNo}</b>
        <small>${escapeHtml(task.resultNote || '暂无结果备注')}</small>
      </div>
      <span class="dvsa-task-pill">${escapeHtml(task.status)}</span>`;
  }

  function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll(`#${PREFIX}-panel .dvsa-tab`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll(`#${PREFIX}-panel .dvsa-page`).forEach(page => {
      page.hidden = page.dataset.page !== tab;
    });

    if (tab === 'tasks') renderTasks();
    if (tab === 'favorites') renderFavorites();
    if (tab === 'history') renderHistory();
  }

  function renderTasks() {
    const root = $(`#${PREFIX}-tasks`);
    if (!root) return;
    root.innerHTML = '';

    if (!tasks.length) {
      root.innerHTML = '<div class="dvsa-empty">暂无任务。先在“生成”页点击“保存为任务”。</div>';
      return;
    }

    tasks.forEach(task => {
      const row = document.createElement('div');
      row.className = `dvsa-task-card${task.id === currentTaskId ? ' current' : ''}`;

      const parent = task.parentId ? tasks.find(x => x.id === task.parentId) : null;
      const relation = parent ? ` ← V${parent.versionNo}` : '';

      row.innerHTML = `
        <div class="dvsa-task-top">
          <div>
            <b>V${task.versionNo}${escapeHtml(relation)} · ${escapeHtml(task.name)}</b>
            <small>${new Date(task.updatedAt || task.createdAt).toLocaleString()}</small>
          </div>
          <select class="dvsa-status">
            ${STATUS_LIST.map(s => `<option${s === task.status ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <textarea class="dvsa-note" placeholder="结果备注：例如 前3秒不错 / 产品变形 / 击中不明显">${escapeHtml(task.resultNote || '')}</textarea>
        <div class="dvsa-row-actions">
          <button data-act="load">载入</button>
          <button data-act="fill">填入豆包</button>
          <button data-act="branch">复制为新版本</button>
          <button class="danger" data-act="delete">删除</button>
        </div>`;

      row.querySelector('.dvsa-status').onchange = e => setTaskStatus(task.id, e.target.value);
      row.querySelector('.dvsa-note').onchange = e => setTaskNote(task.id, e.target.value);
      row.querySelector('[data-act="load"]').onclick = () => loadTask(task.id);
      row.querySelector('[data-act="fill"]').onclick = async () => {
        loadTask(task.id);
        await fillDoubao();
      };
      row.querySelector('[data-act="branch"]').onclick = () => {
        loadTask(task.id);
        createVersionBranchFrom(task.id);
      };
      row.querySelector('[data-act="delete"]').onclick = () => deleteTask(task.id);

      root.appendChild(row);
    });
  }

  function renderFavorites() {
    const root = $(`#${PREFIX}-favorites`);
    if (!root) return;

    const query = ($(`#${PREFIX}-fav-search`)?.value || '').trim().toLowerCase();
    const list = favorites.filter(f =>
      !query ||
      f.name.toLowerCase().includes(query) ||
      (f.note || '').toLowerCase().includes(query) ||
      (f.prompt || '').toLowerCase().includes(query)
    );

    root.innerHTML = '';

    if (!list.length) {
      root.innerHTML = '<div class="dvsa-empty">没有匹配的收藏</div>';
      return;
    }

    list.forEach(fav => {
      const row = document.createElement('div');
      row.className = 'dvsa-fav-card';
      row.innerHTML = `
        <div class="dvsa-fav-top">
          <div><b>⭐ ${escapeHtml(fav.name)}</b><small>${escapeHtml(fav.note || '无备注')}</small></div>
        </div>
        <div class="dvsa-row-actions">
          <button data-act="load">载入</button>
          <button data-act="fill">填入豆包</button>
          <button data-act="copy">复制</button>
          <button data-act="edit">编辑</button>
          <button class="danger" data-act="delete">删除</button>
        </div>`;

      row.querySelector('[data-act="load"]').onclick = () => loadFavorite(fav.id);
      row.querySelector('[data-act="fill"]').onclick = async () => {
        loadFavorite(fav.id);
        await fillDoubao();
      };
      row.querySelector('[data-act="copy"]').onclick = async () => {
        await copyText(fav.prompt);
        toast('收藏提示词已复制');
      };
      row.querySelector('[data-act="edit"]').onclick = () => editFavorite(fav.id);
      row.querySelector('[data-act="delete"]').onclick = () => deleteFavorite(fav.id);

      root.appendChild(row);
    });
  }

  function renderHistory() {
    const root = $(`#${PREFIX}-history`);
    if (!root) return;
    root.innerHTML = '';

    if (!history.length) {
      root.innerHTML = '<div class="dvsa-empty">暂无历史记录</div>';
      return;
    }

    history.slice(0, 30).forEach(item => {
      const row = document.createElement('div');
      row.className = 'dvsa-history-card';
      row.innerHTML = `
        <div>
          <b>${escapeHtml(item.role)}</b>
          <small>${escapeHtml(item.time)}</small>
        </div>
        <div class="dvsa-row-actions compact">
          <button data-act="restore">恢复</button>
          <button data-act="copy">复制</button>
        </div>`;

      row.querySelector('[data-act="restore"]').onclick = () => {
        currentPrompt = item.prompt;
        $(`#${PREFIX}-preview`).value = item.prompt;
        switchTab('generate');
        toast('已恢复历史提示词');
      };

      row.querySelector('[data-act="copy"]').onclick = async () => {
        await copyText(item.prompt);
        toast('已复制');
      };

      root.appendChild(row);
    });
  }

  /* =========================================================
     UI
  ========================================================= */

  function installStyle() {
    if ($(`#${PREFIX}-style`)) return;

    const style = document.createElement('style');
    style.id = `${PREFIX}-style`;
    style.textContent = `
#${PREFIX}-fab{
position:fixed!important;right:78px!important;bottom:96px!important;z-index:2147483644!important;
width:48px!important;height:48px!important;border:0!important;border-radius:14px!important;
background:#fff!important;color:#111!important;box-shadow:0 8px 30px rgba(0,0,0,.18)!important;
cursor:pointer!important;font-size:21px!important;
}
#${PREFIX}-panel{
position:fixed!important;right:78px!important;bottom:154px!important;z-index:2147483645!important;
width:480px!important;max-height:82vh!important;background:#fff!important;color:#18181b!important;
border:1px solid #e7e7e9!important;border-radius:16px!important;box-shadow:0 18px 55px rgba(0,0,0,.18)!important;
overflow:hidden!important;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif!important;
}
#${PREFIX}-panel[hidden],#${PREFIX}-panel .dvsa-page[hidden]{display:none!important}
.dvsa-head{height:50px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee}
.dvsa-title{font-size:15px;font-weight:700}.dvsa-ver{font-size:10px;color:#999;font-weight:400;margin-left:4px}
.dvsa-close{border:0;background:transparent;font-size:18px;cursor:pointer;color:#777}
.dvsa-tabs{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #eee}
.dvsa-tab{border:0;background:#fff;padding:10px 4px;font-size:12px;cursor:pointer;color:#777}
.dvsa-tab.active{color:#111;font-weight:700;box-shadow:inset 0 -2px 0 #111}
.dvsa-scroll{max-height:calc(82vh - 90px);overflow:auto;padding:12px}
.dvsa-current{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 10px;background:#f7f7f8;border-radius:10px;margin-bottom:10px}
.dvsa-current b{display:block;font-size:12px}.dvsa-current small{display:block;color:#888;font-size:10px;margin-top:3px;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dvsa-task-pill{font-size:10px;background:#fff;border:1px solid #ddd;border-radius:999px;padding:4px 7px;white-space:nowrap}
.dvsa-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dvsa-field{display:flex;flex-direction:column;gap:4px;margin-bottom:8px}.dvsa-field.full{grid-column:1/-1}
.dvsa-field label{font-size:11px;color:#777;display:flex;align-items:center;justify-content:space-between}
.dvsa-field input,.dvsa-field select,.dvsa-field textarea{
width:100%;box-sizing:border-box;border:1px solid #dedee2;border-radius:8px;background:#fff;color:#222;padding:8px 9px;font:12px/1.4 inherit;outline:none
}
.dvsa-field textarea{resize:vertical;min-height:56px}
.dvsa-lock{display:inline-flex!important;align-items:center!important;gap:3px!important;font-size:10px!important;color:#888!important;cursor:pointer!important}
.dvsa-lock input{width:auto!important;margin:0!important}
.dvsa-details{border:1px solid #eee;border-radius:10px;padding:8px;margin:5px 0 10px}.dvsa-details summary{cursor:pointer;font-size:12px;font-weight:650;color:#555}
.dvsa-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin:9px 0}
.dvsa-actions.three{grid-template-columns:repeat(3,1fr)}
.dvsa-btn{border:0;border-radius:8px;padding:9px 7px;cursor:pointer;font:600 11px/1.2 inherit}
.dvsa-primary{background:#18181b;color:#fff}.dvsa-light{background:#f1f1f3;color:#222}.dvsa-warn{background:#fff3d8;color:#6d4b00}
#${PREFIX}-preview{min-height:240px;font-size:11px;line-height:1.55}
.dvsa-section-title{font-size:12px;font-weight:700;color:#555;margin:12px 0 7px}
.dvsa-task-card,.dvsa-fav-card,.dvsa-history-card{border:1px solid #ececef;border-radius:10px;padding:9px;margin-bottom:8px}
.dvsa-task-card.current{border-color:#999;box-shadow:0 0 0 1px #bbb inset}
.dvsa-task-top,.dvsa-fav-top,.dvsa-history-card{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.dvsa-task-top b,.dvsa-fav-top b,.dvsa-history-card b{display:block;font-size:12px}.dvsa-task-top small,.dvsa-fav-top small,.dvsa-history-card small{display:block;font-size:9px;color:#999;margin-top:3px}
.dvsa-status{max-width:90px;border:1px solid #ddd;border-radius:7px;padding:5px;font-size:10px}
.dvsa-note{width:100%;box-sizing:border-box;min-height:54px;margin:8px 0;border:1px solid #e3e3e6;border-radius:8px;padding:7px;font:11px/1.4 inherit;resize:vertical}
.dvsa-row-actions{display:flex;flex-wrap:wrap;gap:5px}.dvsa-row-actions button{border:0;border-radius:6px;background:#f1f1f3;padding:6px 8px;font-size:10px;cursor:pointer}.dvsa-row-actions button.danger{background:#fff0f0;color:#a42525}.dvsa-row-actions.compact{flex-wrap:nowrap}
.dvsa-empty{text-align:center;padding:28px 10px;color:#999;font-size:12px}
.dvsa-search{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:8px 9px;margin-bottom:9px}
.dvsa-matrix{border:1px dashed #d8d8dc;border-radius:10px;padding:9px;margin-bottom:10px}.dvsa-check-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4px 8px;font-size:10px;max-height:120px;overflow:auto;padding:4px 0}.dvsa-check-grid label{display:flex;gap:5px;align-items:flex-start}
.dvsa-tip{padding:8px 9px;background:#f7f7f8;border-radius:8px;color:#777;font-size:10px;line-height:1.5;margin-bottom:9px}
#${PREFIX}-toast{position:fixed;left:50%;bottom:75px;transform:translateX(-50%);z-index:2147483647;background:rgba(0,0,0,.82);color:#fff;padding:9px 14px;border-radius:9px;font:13px/1.4 sans-serif;pointer-events:none}
`;
    (document.head || document.documentElement).appendChild(style);
  }

  function createUI() {
    if ($(`#${PREFIX}-fab`)) return;

    const fab = document.createElement('button');
    fab.id = `${PREFIX}-fab`;
    fab.type = 'button';
    fab.textContent = '🎬';
    fab.title = '豆包视频生成助手';

    const panel = document.createElement('div');
    panel.id = `${PREFIX}-panel`;
    panel.hidden = true;

    panel.innerHTML = `
<div class="dvsa-head">
  <div class="dvsa-title">豆包视频生成助手 <span class="dvsa-ver">v${VERSION}</span></div>
  <button class="dvsa-close" id="${PREFIX}-close">×</button>
</div>

<div class="dvsa-tabs">
  <button class="dvsa-tab active" data-tab="generate">生成</button>
  <button class="dvsa-tab" data-tab="tasks">任务</button>
  <button class="dvsa-tab" data-tab="favorites">收藏</button>
  <button class="dvsa-tab" data-tab="history">历史</button>
</div>

<div class="dvsa-scroll">

  <section class="dvsa-page" data-page="generate">
    <div class="dvsa-current" id="${PREFIX}-current-task"></div>

    <div class="dvsa-tip">所有主要内容都可以自己填写。🔒 锁定后，“下一条”不会改变该变量；最终提示词也可以直接手改。</div>

    ${datalistHTML(`${PREFIX}-roles-list`, Object.keys(ROLE_PRESETS))}
    ${datalistHTML(`${PREFIX}-hooks-list`, HOOK_PRESETS)}
    ${datalistHTML(`${PREFIX}-scenes-list`, SCENE_PRESETS)}
    ${datalistHTML(`${PREFIX}-products-list`, PRODUCT_PRESETS)}

    <div class="dvsa-grid">
      <div class="dvsa-field">
        <label>下一条怎么变化</label>
        <select id="${PREFIX}-nextmode">
          ${optionHTML(['换角色，结构不变','角色不变，换前1秒Hook','手动调整'], config.nextMode)}
        </select>
      </div>

      <div class="dvsa-field">
        <label>角色 <span class="dvsa-lock"><input type="checkbox" id="${PREFIX}-lock-role"><span id="${PREFIX}-locklabel-role">🔓</span></span></label>
        <input id="${PREFIX}-role" list="${PREFIX}-roles-list" value="${escapeHtml(config.role)}">
      </div>

      <div class="dvsa-field full">
        <label>前 1 秒 Hook <span class="dvsa-lock"><input type="checkbox" id="${PREFIX}-lock-hook"><span id="${PREFIX}-locklabel-hook">🔓</span></span></label>
        <input id="${PREFIX}-hook" list="${PREFIX}-hooks-list" value="${escapeHtml(config.hook)}">
      </div>

      <div class="dvsa-field full">
        <label>场景 <span class="dvsa-lock"><input type="checkbox" id="${PREFIX}-lock-scene"><span id="${PREFIX}-locklabel-scene">🔓</span></span></label>
        <input id="${PREFIX}-scene" list="${PREFIX}-scenes-list" value="${escapeHtml(config.scene)}">
      </div>

      <div class="dvsa-field full">
        <label>产品 <span class="dvsa-lock"><input type="checkbox" id="${PREFIX}-lock-product"><span id="${PREFIX}-locklabel-product">🔓</span></span></label>
        <input id="${PREFIX}-product" list="${PREFIX}-products-list" value="${escapeHtml(config.product)}">
      </div>

      <div class="dvsa-field">
        <label>时长</label>
        <input id="${PREFIX}-duration" type="number" min="1" max="60" value="${config.duration}">
      </div>

      <div class="dvsa-field">
        <label>比例</label>
        <input id="${PREFIX}-ratio" value="${escapeHtml(config.ratio)}">
      </div>
    </div>

    <details class="dvsa-details">
      <summary>高级动作细节（可自己填写）</summary>
      <div class="dvsa-field"><label>发现危险</label><textarea id="${PREFIX}-observe">${escapeHtml(config.observe)}</textarea></div>
      <div class="dvsa-field"><label>追击动作</label><textarea id="${PREFIX}-chase">${escapeHtml(config.chase)}</textarea></div>
      <div class="dvsa-field"><label>击中动作</label><textarea id="${PREFIX}-attack">${escapeHtml(config.attack)}</textarea></div>
      <div class="dvsa-field"><label>结尾动作</label><textarea id="${PREFIX}-finish">${escapeHtml(config.finish)}</textarea></div>
    </details>

    <div class="dvsa-field full">
      <label>本条额外要求</label>
      <textarea id="${PREFIX}-extra" placeholder="例如：3–4 秒连续两次横向滑步；最后一秒回头看宝宝。">${escapeHtml(config.extra)}</textarea>
    </div>

    <div class="dvsa-actions">
      <button class="dvsa-btn dvsa-light" id="${PREFIX}-prev">← 上一条</button>
      <button class="dvsa-btn dvsa-light" id="${PREFIX}-next">下一条 →</button>
      <button class="dvsa-btn dvsa-primary" id="${PREFIX}-generate">生成提示词</button>
      <button class="dvsa-btn dvsa-primary" id="${PREFIX}-fill">填入豆包</button>
      <button class="dvsa-btn dvsa-light" id="${PREFIX}-copy">复制提示词</button>
      <button class="dvsa-btn dvsa-light" id="${PREFIX}-favorite">⭐ 收藏当前</button>
    </div>

    <div class="dvsa-actions three">
      <button class="dvsa-btn dvsa-light" id="${PREFIX}-savetask">保存为任务</button>
      <button class="dvsa-btn dvsa-light" id="${PREFIX}-branch">复制为新版本</button>
      <button class="dvsa-btn dvsa-light" id="${PREFIX}-updatetask">更新当前版本</button>
    </div>

    <div class="dvsa-actions">
      <button class="dvsa-btn dvsa-warn" id="${PREFIX}-copyconfig">复制当前配置</button>
      <button class="dvsa-btn dvsa-warn" id="${PREFIX}-importconfig">导入当前配置</button>
    </div>

    <div class="dvsa-section-title">最终提示词（可直接修改）</div>
    <div class="dvsa-field full">
      <textarea id="${PREFIX}-preview"></textarea>
    </div>
  </section>

  <section class="dvsa-page" data-page="tasks" hidden>
    <div class="dvsa-matrix">
      <div class="dvsa-section-title" style="margin-top:0">批量测试矩阵</div>
      <div class="dvsa-tip">例如选 3 个角色 × 2 个 Hook，会一次生成 6 个“待生成”任务，不会自动发送。</div>
      <b style="font-size:11px">角色</b>
      <div class="dvsa-check-grid" id="${PREFIX}-matrix-roles">
        ${Object.keys(ROLE_PRESETS).map((r,i)=>`<label><input type="checkbox" value="${escapeHtml(r)}"${i<3?' checked':''}>${escapeHtml(r)}</label>`).join('')}
      </div>
      <b style="font-size:11px">Hook</b>
      <div class="dvsa-check-grid" id="${PREFIX}-matrix-hooks">
        ${HOOK_PRESETS.map((h,i)=>`<label><input type="checkbox" value="${escapeHtml(h)}"${i<2?' checked':''}>${escapeHtml(h)}</label>`).join('')}
      </div>
      <button class="dvsa-btn dvsa-primary" id="${PREFIX}-creatematrix" style="width:100%;margin-top:7px">生成测试任务矩阵</button>
    </div>
    <div id="${PREFIX}-tasks"></div>
  </section>

  <section class="dvsa-page" data-page="favorites" hidden>
    <input class="dvsa-search" id="${PREFIX}-fav-search" placeholder="搜索收藏名称、备注、提示词">
    <div id="${PREFIX}-favorites"></div>
  </section>

  <section class="dvsa-page" data-page="history" hidden>
    <button class="dvsa-btn dvsa-light" id="${PREFIX}-clearhistory" style="width:100%;margin-bottom:8px">清空历史</button>
    <div id="${PREFIX}-history"></div>
  </section>

</div>`;

    document.documentElement.append(fab, panel);

    fab.onclick = () => {
      panelOpen = !panelOpen;
      panel.hidden = !panelOpen;
      if (panelOpen && !currentPrompt) generatePrompt(false);
    };

    $(`#${PREFIX}-close`).onclick = () => {
      panelOpen = false;
      panel.hidden = true;
    };

    document.querySelectorAll(`#${PREFIX}-panel .dvsa-tab`).forEach(btn => {
      btn.onclick = () => switchTab(btn.dataset.tab);
    });

    const bindInput = (id, key, parser = v => v, onChange = null) => {
      const el = $(`#${PREFIX}-${id}`);
      const eventName = el?.tagName === 'SELECT' ? 'change' : 'input';

      el?.addEventListener(eventName, e => {
        config[key] = parser(e.target.value);

        if (onChange) onChange(e.target.value);

        saveAll();
        currentPrompt = buildPrompt();
      });
    };

    bindInput('nextmode', 'nextMode');
    bindInput('role', 'role', v => v, role => {
      applyRolePresetIfKnown(role);
      syncControls();
    });
    bindInput('hook', 'hook');
    bindInput('scene', 'scene');
    bindInput('product', 'product');
    bindInput('duration', 'duration', v => Math.max(1, Number(v) || 10));
    bindInput('ratio', 'ratio');
    bindInput('observe', 'observe');
    bindInput('chase', 'chase');
    bindInput('attack', 'attack');
    bindInput('finish', 'finish');
    bindInput('extra', 'extra');

    ['role','hook','scene','product'].forEach(key => {
      $(`#${PREFIX}-lock-${key}`).onchange = e => toggleLock(key, e.target.checked);
    });

    $(`#${PREFIX}-prev`).onclick = () => nextVariant(-1);
    $(`#${PREFIX}-next`).onclick = () => nextVariant(1);
    $(`#${PREFIX}-generate`).onclick = () => {
      generatePrompt(true);
      toast('提示词已生成');
    };
    $(`#${PREFIX}-fill`).onclick = fillDoubao;
    $(`#${PREFIX}-copy`).onclick = copyPrompt;
    $(`#${PREFIX}-favorite`).onclick = addFavorite;

    $(`#${PREFIX}-savetask`).onclick = saveAsTask;
    $(`#${PREFIX}-branch`).onclick = () => createVersionBranchFrom();
    $(`#${PREFIX}-updatetask`).onclick = updateCurrentTask;

    $(`#${PREFIX}-copyconfig`).onclick = copyCurrentConfig;
    $(`#${PREFIX}-importconfig`).onclick = importCurrentConfig;

    $(`#${PREFIX}-creatematrix`).onclick = createMatrixTasks;
    $(`#${PREFIX}-fav-search`).oninput = renderFavorites;
    $(`#${PREFIX}-clearhistory`).onclick = clearHistory;

    syncControls();
    generatePrompt(false);
    updateCurrentTaskBar();
    renderTasks();
    renderFavorites();
    renderHistory();
  }

  function boot() {
    installStyle();
    createUI();
    console.log(`[DVSA] v${VERSION} loaded`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
'''

path = Path('/mnt/data/doubao-video-studio-assistant-v0.3.0.user.js')
path.write_text(code, encoding='utf-8')

# basic sanity checks
assert code.startswith('// ==UserScript==')
assert code.rstrip().endswith('})();')
print(f'Created: {path}\nLines: {code.count(chr(10))+1}\nBytes: {path.stat().st_size}')
