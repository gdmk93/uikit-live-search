/*! UIkit 3.23.11 | https://www.getuikit.com | (c) 2014 - 2025 YOOtheme | MIT License */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('uikit-util')) :
    typeof define === 'function' && define.amd ? define('uikitlive_search', ['uikit-util'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.UIkitLive_search = factory(global.UIkit.util));
})(this, (function (util) { 'use strict';

    function storeScrollPosition(element) {
      const scrollElement = util.scrollParent(element);
      const { scrollTop } = scrollElement;
      return () => {
        if (scrollTop !== scrollElement.scrollTop) {
          scrollElement.scrollTop = scrollTop;
        }
      };
    }

    var Togglable = {
      props: {
        cls: Boolean,
        animation: "list",
        duration: Number,
        velocity: Number,
        origin: String,
        transition: String
      },
      data: {
        cls: false,
        animation: [false],
        duration: 200,
        velocity: 0.2,
        origin: false,
        transition: "ease",
        clsEnter: "uk-togglable-enter",
        clsLeave: "uk-togglable-leave"
      },
      computed: {
        hasAnimation: ({ animation }) => !!animation[0],
        hasTransition: ({ animation }) => ["slide", "reveal"].some((transition) => util.startsWith(animation[0], transition))
      },
      methods: {
        async toggleElement(targets, toggle, animate) {
          try {
            await Promise.all(
              util.toNodes(targets).map((el) => {
                const show = util.isBoolean(toggle) ? toggle : !this.isToggled(el);
                if (!util.trigger(el, `before${show ? "show" : "hide"}`, [this])) {
                  return Promise.reject();
                }
                const promise = (util.isFunction(animate) ? animate : animate === false || !this.hasAnimation ? toggleInstant : this.hasTransition ? toggleTransition : toggleAnimation)(el, show, this);
                const cls = show ? this.clsEnter : this.clsLeave;
                util.addClass(el, cls);
                util.trigger(el, show ? "show" : "hide", [this]);
                const done = () => {
                  var _a;
                  util.removeClass(el, cls);
                  util.trigger(el, show ? "shown" : "hidden", [this]);
                  if (show) {
                    const restoreScrollPosition = storeScrollPosition(el);
                    (_a = util.$$("[autofocus]", el).find(util.isVisible)) == null ? void 0 : _a.focus();
                    restoreScrollPosition();
                  }
                };
                return promise ? promise.then(done, () => {
                  util.removeClass(el, cls);
                  return Promise.reject();
                }) : done();
              })
            );
            return true;
          } catch (e) {
            return false;
          }
        },
        isToggled(el = this.$el) {
          el = util.toNode(el);
          return util.hasClass(el, this.clsEnter) ? true : util.hasClass(el, this.clsLeave) ? false : this.cls ? util.hasClass(el, this.cls.split(" ")[0]) : util.isVisible(el);
        },
        _toggle(el, toggled) {
          if (!el) {
            return;
          }
          toggled = Boolean(toggled);
          let changed;
          if (this.cls) {
            changed = util.includes(this.cls, " ") || toggled !== util.hasClass(el, this.cls);
            changed && util.toggleClass(el, this.cls, util.includes(this.cls, " ") ? void 0 : toggled);
          } else {
            changed = toggled === el.hidden;
            changed && (el.hidden = !toggled);
          }
          if (changed) {
            util.trigger(el, "toggled", [toggled, this]);
          }
        }
      }
    };
    function toggleInstant(el, show, { _toggle }) {
      util.Animation.cancel(el);
      util.Transition.cancel(el);
      return _toggle(el, show);
    }
    async function toggleTransition(el, show, { animation, duration, velocity, transition, _toggle }) {
      var _a;
      const [mode = "reveal", startProp = "top"] = ((_a = animation[0]) == null ? void 0 : _a.split("-")) || [];
      const dirs = [
        ["left", "right"],
        ["top", "bottom"]
      ];
      const dir = dirs[util.includes(dirs[0], startProp) ? 0 : 1];
      const end = dir[1] === startProp;
      const props = ["width", "height"];
      const dimProp = props[dirs.indexOf(dir)];
      const marginProp = `margin-${dir[0]}`;
      const marginStartProp = `margin-${startProp}`;
      let currentDim = util.dimensions(el)[dimProp];
      const inProgress = util.Transition.inProgress(el);
      await util.Transition.cancel(el);
      if (show) {
        _toggle(el, true);
      }
      const prevProps = Object.fromEntries(
        [
          "padding",
          "border",
          "width",
          "height",
          "minWidth",
          "minHeight",
          "overflowY",
          "overflowX",
          marginProp,
          marginStartProp
        ].map((key) => [key, el.style[key]])
      );
      const dim = util.dimensions(el);
      const currentMargin = util.toFloat(util.css(el, marginProp));
      const marginStart = util.toFloat(util.css(el, marginStartProp));
      const endDim = dim[dimProp] + marginStart;
      if (!inProgress && !show) {
        currentDim += marginStart;
      }
      const [wrapper] = util.wrapInner(el, "<div>");
      util.css(wrapper, {
        boxSizing: "border-box",
        height: dim.height,
        width: dim.width,
        ...util.css(el, [
          "overflow",
          "padding",
          "borderTop",
          "borderRight",
          "borderBottom",
          "borderLeft",
          "borderImage",
          marginStartProp
        ])
      });
      util.css(el, {
        padding: 0,
        border: 0,
        minWidth: 0,
        minHeight: 0,
        [marginStartProp]: 0,
        width: dim.width,
        height: dim.height,
        overflow: "hidden",
        [dimProp]: currentDim
      });
      const percent = currentDim / endDim;
      duration = (velocity * endDim + duration) * (show ? 1 - percent : percent);
      const endProps = { [dimProp]: show ? endDim : 0 };
      if (end) {
        util.css(el, marginProp, endDim - currentDim + currentMargin);
        endProps[marginProp] = show ? currentMargin : endDim + currentMargin;
      }
      if (!end ^ mode === "reveal") {
        util.css(wrapper, marginProp, -endDim + currentDim);
        util.Transition.start(wrapper, { [marginProp]: show ? 0 : -endDim }, duration, transition);
      }
      try {
        await util.Transition.start(el, endProps, duration, transition);
      } finally {
        util.css(el, prevProps);
        util.unwrap(wrapper.firstChild);
        if (!show) {
          _toggle(el, false);
        }
      }
    }
    function toggleAnimation(el, show, cmp) {
      const { animation, duration, _toggle } = cmp;
      if (show) {
        _toggle(el, true);
        return util.Animation.in(el, animation[0], duration, cmp.origin);
      }
      return util.Animation.out(el, animation[1] || animation[0], duration, cmp.origin).then(
        () => _toggle(el, false)
      );
    }

    var I18n = {
      props: {
        i18n: Object
      },
      data: {
        i18n: null
      },
      methods: {
        t(key, ...params) {
          var _a, _b, _c;
          let i = 0;
          return ((_c = ((_a = this.i18n) == null ? void 0 : _a[key]) || ((_b = this.$options.i18n) == null ? void 0 : _b[key])) == null ? void 0 : _c.replace(
            /%s/g,
            () => params[i++] || ""
          )) || "";
        }
      }
    };

    util.memoize((id, props) => {
      const attributes = Object.keys(props);
      const filter = attributes.concat(id).map((key) => [util.hyphenate(key), `data-${util.hyphenate(key)}`]).flat();
      return { attributes, filter };
    });

    let id = 1;
    function generateId(instance, el = null) {
      return (el == null ? void 0 : el.id) || `${instance.$options.id}-${id++}`;
    }

    function maybeDefaultPreventClick(e) {
      if (e.target.closest('a[href="#"],a[href=""]')) {
        e.preventDefault();
      }
    }

    const keyMap = {
      ESC: 27};

    var Component = {
      mixins: [I18n, Togglable],
      i18n: {
        enterKeyHint: "Search"
      },
      props: {
        target: String,
        selInput: String,
        selSpinner: String,
        selControl: String,
        selTrackLink: String,
        template: String,
        attrName: String,
        historyStorageKey: String,
        historyLimit: Number,
        historyDisplayLimit: Number,
        popular: String,
        timeout: Number,
        cache: Boolean,
        caseInsensitive: Boolean
      },
      data: {
        target: "#uk-live-search-result",
        selInput: 'input[type="search"]',
        selSpinner: ".uk-spinner",
        selControl: ".uk-live-search-control",
        selTrackLink: 'a[href]:not([href=""], [href="#"])',
        template: "#uk-live-search-template",
        attrName: "uk-live-search-command",
        historyStorageKey: "live-search",
        historyLimit: 50,
        historyDisplayLimit: 10,
        popular: false,
        timeout: 1e4,
        cache: true,
        caseInsensitive: true
      },
      computed: {
        target: ({ target }) => util.$(target),
        input: ({ selInput }, $el) => util.$(selInput, $el),
        spinner: ({ selSpinner }, $el) => util.$(selSpinner, $el),
        controls: ({ selControl }, $el) => util.$$(selControl, $el),
        popular: ({ popular }) => {
          if (!popular) {
            return false;
          }
          if (util.startsWith(popular, "[")) {
            try {
              return JSON.parse(popular);
            } catch (e) {
            }
          }
          return popular.split(/\s*,\s*/);
        }
      },
      watch: {
        target(target) {
          var _a, _b;
          (_a = this.offDrop) == null ? void 0 : _a.call(this);
          const el = target.closest(".uk-drop, .uk-dropdown");
          this.drop = (_b = this.$getComponent(el, "drop")) != null ? _b : this.$getComponent(el, "dropdown");
          this.offDrop = util.on(el, "show hide", () => {
            queueMicrotask(() => {
              util.removeAttr(this.drop.targetEl, "aria-expanded");
              util.attr(this.input, "aria-expanded", this.drop.isToggled());
            });
          }, {
            self: true
          });
          const id = generateId(this, el);
          util.attr(el, {
            id,
            role: "region",
            "aria-live": "polite"
          });
          util.attr(this.input, {
            "aria-controls": id,
            "aria-haspopup": true,
            "aria-expanded": false
          });
        },
        spinner() {
          this.toggleSpinner(this.isProcessing, false);
        },
        controls() {
          this.toggleControls(this.getValue(), false);
        }
      },
      connected() {
        var _a;
        util.attr(this.input, {
          autocorrect: "off",
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: false,
          inputmode: "search",
          enterkeyhint: this.t("enterKeyHint")
        });
        this.inputCommand = (_a = util.data(this.input, this.attrName)) != null ? _a : "search:merge:debounce.400 {}";
        this.prevInputValue = this.getValue();
        this.history = new History(this.historyStorageKey, this.historyLimit, this.caseInsensitive);
        const template = new Template(util.html(this.template));
        this.getHtml = (data2) => template.render(data2);
        this.pendingCommand = "search {}";
      },
      disconnected() {
        this.offDrop();
      },
      methods: {
        getValue() {
          return this.input.value.trim();
        },
        toggleSpinner(toggle, animate = true) {
          toggle = !!toggle;
          if (this.spinner && toggle !== this.isToggled(this.spinner)) {
            this.toggleElement(this.spinner, toggle, animate);
          }
        },
        toggleControls(toggle, animate = true) {
          toggle = !!toggle;
          this.toggleElement(
            this.controls.filter((el) => toggle !== this.isToggled(el)),
            toggle,
            animate
          );
        },
        toggleDrop(toggle) {
          toggle = !!toggle;
          if (toggle !== this.drop.isToggled()) {
            toggle ? this.drop.show(this.$el, false) : this.drop.hide(false);
          }
        },
        syncFormParams: /* @__PURE__ */ (() => {
          let elements = [];
          return function(searchParams) {
            const addInputs = (obj, path) => {
              for (const [key, value] of Object.entries(obj)) {
                if (value === null || key === this.input.name) {
                  continue;
                }
                const name = path ? `${path}[${key}]` : key;
                if (util.isArray(value) || util.isPlainObject(value)) {
                  addInputs(value, name);
                } else {
                  const element = util.append(
                    this.input.form,
                    `<input type="hidden" name="${escape(name)}" value="${escape(value)}"/>`
                  );
                  elements.push(element);
                }
              }
            };
            util.remove(elements);
            elements = [];
            addInputs(searchParams);
          };
        })(),
        async withSpinner(fn, ...args) {
          const timer = setTimeout(() => this.toggleSpinner(true), 200);
          try {
            return await fn(...args);
          } finally {
            clearTimeout(timer);
          }
        },
        async sendRequest(searchParams, commandObj) {
          const abortController = new AbortController();
          let isDone = false;
          let abortReason;
          this.cancelRequest = (reason) => {
            if (isDone) {
              return;
            }
            isDone = true;
            abortReason = reason;
            abortController.abort();
          };
          const debounce = Math.max(0, parseInt(commandObj.mods.debounce) || 0);
          let timer;
          if (this.timeout) {
            timer = setTimeout(
              () => this.cancelRequest(Reasons.TIMEOUT),
              this.timeout + debounce
            );
          }
          try {
            if (debounce) {
              await delayBeforeFetch(debounce, abortController.signal);
            }
            const { method, action } = this.input.form;
            const formData = new FormData(this.input.form);
            formData.set("live-search", true);
            const options = {
              signal: abortController.signal
            };
            return await this.withSpinner(doFetch, method, action, formData, options);
          } catch (e) {
            e.isAbort = e.name === "AbortError";
            if (e.isAbort) {
              e.reason = abortReason;
            }
            throw e;
          } finally {
            isDone = true;
            clearTimeout(timer);
          }
        },
        updateState: /* @__PURE__ */ (() => {
          let cache = [];
          return async function(searchParams, commandObj) {
            var _a;
            delete this.pendingCommand;
            (_a = this.cancelRequest) == null ? void 0 : _a.call(this, Reasons.STALE);
            this.syncFormParams(searchParams);
            const hasParams = !util.isEmpty(searchParams);
            this.toggleControls(hasParams);
            let html;
            if (hasParams) {
              const item = cache.find((item2) => isDeepEqual(item2.searchParams, searchParams));
              if (item) {
                html = item.html;
              } else {
                try {
                  this.isProcessing = true;
                  html = await this.sendRequest(searchParams, commandObj);
                  if (this.cache) {
                    cache.push({ searchParams, html });
                  }
                } catch ({ isAbort, reason }) {
                  if (isAbort && reason === Reasons.STALE) {
                    return;
                  }
                  const command = Command.stringify(deepMerge(commandObj, {
                    mods: {
                      force: true,
                      debounce: false
                    }
                  }));
                  this.pendingCommand = command;
                  if (isAbort && reason === Reasons.CANCEL) {
                    this.isProcessing = false;
                    this.toggleSpinner(false);
                    return;
                  }
                  let data2 = {
                    isError: true,
                    searchParams,
                    command
                  };
                  if (isAbort && reason === Reasons.TIMEOUT) {
                    data2.isTimeout = true;
                    data2.timeout = this.timeout;
                  }
                  html = this.getHtml(data2);
                }
              }
            } else {
              html = this.getHtml({
                history: this.history.queries.slice(0, this.historyDisplayLimit),
                popular: this.popular
              });
            }
            this.isProcessing = false;
            this.toggleSpinner(false);
            util.html(this.target, html);
            this.toggleDrop(true);
          };
        })(),
        dispatchCommand: /* @__PURE__ */ (() => {
          let prevCmdData = {};
          return function(command) {
            const commandObj = Command.parse(command);
            let { base, mods, value } = commandObj;
            const isValid = value ? base === "search" || base === "history.remove" : base === "input.clear" || base === "history.clear";
            if (!isValid) {
              return;
            }
            if (mods.focus) {
              this.input.focus();
            }
            let searchParams = {};
            let cmdData = { base, value };
            if (base === "search") {
              const key = this.input.name;
              if (util.startsWith(value, '"') || util.startsWith(value, "{")) {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                }
              }
              if (util.isPlainObject(value)) {
                searchParams = value;
                if (util.hasOwn(searchParams, key)) {
                  const paramValue = searchParams[key];
                  if (!util.isString(paramValue) && !util.isNumber(paramValue)) {
                    return;
                  }
                  value = paramValue.trim();
                  delete searchParams[key];
                } else {
                  value = this.getValue();
                }
              }
              if (value) {
                searchParams[key] = value;
              }
              if (mods.merge && !util.isEmpty(searchParams)) {
                searchParams = deepMerge(prevCmdData.value, searchParams);
              }
              cmdData.value = deepClone(searchParams);
            }
            if ((base !== "search" || !mods.force) && isDeepEqual(cmdData, prevCmdData)) {
              return;
            }
            prevCmdData = cmdData;
            if (base === "search" || base === "input.clear") {
              this.input.value = value != null ? value : "";
            } else if (base === "history.remove") {
              this.history.remove(value);
            } else if (base === "history.clear") {
              this.history.clear();
            }
            this.updateState(searchParams, commandObj);
          };
        })()
      },
      events: [
        {
          name: "click",
          el: ({ $el, target }) => [$el, target],
          delegate: ({ attrName }) => `[${attrName}], [data-${attrName}]`,
          handler(e) {
            if (e.target.closest("a, button")) {
              maybeDefaultPreventClick(e);
              this.dispatchCommand(util.data(e.current, this.attrName));
            }
          }
        },
        {
          name: "click",
          el: ({ target }) => target,
          delegate: ({ selTrackLink }) => selTrackLink,
          handler() {
            this.history.add(this.input.value);
          }
        },
        {
          name: "submit",
          el: ({ input }) => input.form,
          handler() {
            this.history.add(this.input.value);
          }
        },
        {
          name: "input",
          el: ({ input }) => input,
          handler() {
            const value = this.getValue();
            const isEqual = this.caseInsensitive ? value.toLowerCase() === this.prevInputValue.toLowerCase() : value === this.prevInputValue;
            if (!isEqual) {
              this.prevInputValue = value;
              this.dispatchCommand(this.inputCommand);
            }
          }
        },
        {
          name: "focus keydown",
          el: ({ input }) => input,
          handler(e) {
            const { key } = e;
            const isKeydown = e.type === "keydown";
            if (isKeydown && (key === "Enter" || key === "Escape")) {
              e.preventDefault();
            }
            if (!isKeydown || key === "Enter" || key === "ArrowDown") {
              if (this.pendingCommand) {
                this.dispatchCommand(this.pendingCommand);
              } else if (!this.isProcessing) {
                this.toggleDrop(true);
              }
            }
          }
        },
        {
          name: "keydown",
          el: () => document,
          handler(e) {
            var _a;
            if (e.keyCode === keyMap.ESC) {
              (_a = this.cancelRequest) == null ? void 0 : _a.call(this, Reasons.CANCEL);
            }
          }
        },
        {
          name: util.pointerDown,
          el: () => document,
          handler({ target }) {
            var _a;
            if (this.drop.$el.contains(target) || ((_a = this.drop.targetEl) == null ? void 0 : _a.contains(target))) {
              return;
            }
            util.once(document, [util.pointerUp, util.pointerCancel, "scroll"], (e) => {
              var _a2;
              if (e.type === util.pointerUp && e.target === target) {
                (_a2 = this.cancelRequest) == null ? void 0 : _a2.call(this, Reasons.CANCEL);
              }
            }, true);
          }
        }
      ]
    };
    const Command = {
      parse(rawCommand) {
        let [command, value] = rawCommand.trim().split(/\s+([\s\S]+)/, 2);
        let [base, ...rawMods] = command.split(":");
        let mods = {};
        for (const mod of rawMods) {
          let [key, value2 = true] = mod.split(".");
          try {
            value2 = JSON.parse(value2);
          } catch (e) {
          }
          if (value2 === true || util.isString(value2) && value2 || util.isNumber(value2)) {
            mods[key] = value2;
          }
        }
        return { base, mods, value };
      },
      stringify(commandObj) {
        const { base, mods, value } = commandObj;
        let command = [base];
        for (const [key, value2] of Object.entries(mods)) {
          if (value2 === true || util.isString(value2) && value2 || util.isNumber(value2)) {
            command.push(value2 === true ? key : `${key}.${value2}`);
          }
        }
        command = command.join(":");
        if (util.isString(value) && value || util.isNumber(value)) {
          command += ` ${value}`;
        }
        return command;
      }
    };
    function escape(value) {
      return new Option(value).innerHTML.replace(/"/g, "&quot;");
    }
    const Reasons = {
      STALE: "stale",
      TIMEOUT: "timeout",
      CANCEL: "cancel"};
    function delayBeforeFetch(delay, signal) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        util.once(signal, "abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Request cancelled before execution", "AbortError"));
        });
      });
    }
    async function doFetch(method, url, formData, options = {}) {
      method = method.toUpperCase();
      if (method === "POST") {
        options = {
          method,
          body: formData,
          ...options
        };
      } else {
        try {
          const urlObj = new URL(url, location.href);
          const searchParams = new URLSearchParams(formData);
          searchParams.forEach((value, key) => urlObj.searchParams.set(key, value));
          url = urlObj.toString();
        } catch (e) {
          throw new Error(`Invalid form action URL: ${url}`);
        }
      }
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.text();
    }
    function isDeepEqual(a, b) {
      if (a === b) {
        return true;
      }
      if (util.isArray(a)) {
        return util.isArray(b) && a.length === b.length && a.every((value, index) => isDeepEqual(value, b[index]));
      }
      if (util.isPlainObject(a)) {
        return util.isPlainObject(b) && Object.keys(a).length === Object.keys(b).length && util.each(a, (value, key) => isDeepEqual(value, b[key]));
      }
      return false;
    }
    function deepMerge(...sources) {
      const result = {};
      for (const source of sources.filter(util.isPlainObject)) {
        for (const [key, value] of Object.entries(source)) {
          if (util.isArray(value)) {
            result[key] = value.map((item) => util.isPlainObject(item) ? deepMerge({}, item) : item);
          } else if (util.isPlainObject(value)) {
            result[key] = deepMerge(util.isPlainObject(result[key]) ? result[key] : {}, value);
          } else {
            result[key] = value;
          }
        }
      }
      return result;
    }
    function deepClone(value) {
      if (util.isFunction(structuredClone)) {
        return structuredClone(value);
      }
      if (util.isArray(value)) {
        return value.map((item) => deepClone(item));
      }
      if (util.isPlainObject(value)) {
        return deepMerge({}, value);
      }
      return value;
    }
    class History {
      constructor(storageKey, limit, caseInsensitive) {
        try {
          this.storage = localStorage;
        } catch (e) {
        }
        this.storageKey = storageKey;
        this.limit = limit;
        this.caseInsensitive = caseInsensitive;
      }
      get queries() {
        try {
          const queries = JSON.parse(this.storage.getItem(this.storageKey));
          if (util.isArray(queries)) {
            return queries;
          }
        } catch (e) {
        }
        return [];
      }
      set queries(value) {
        var _a;
        (_a = this.storage) == null ? void 0 : _a.setItem(this.storageKey, JSON.stringify(value));
      }
      add(value) {
        value = value.trim().replace(/\s+/g, " ");
        if (!value) {
          return;
        }
        this.remove(value);
        this.queries = [value, ...this.queries].slice(0, this.limit);
      }
      remove(value) {
        const queries = this.queries.filter(
          (item) => this.caseInsensitive ? item.toLowerCase() !== value.toLowerCase() : item !== value
        );
        if (util.isEmpty(queries)) {
          this.clear();
          return;
        }
        this.queries = queries;
      }
      clear() {
        var _a;
        (_a = this.storage) == null ? void 0 : _a.removeItem(this.storageKey);
      }
    }
    class Template {
      constructor(template, mods = {}) {
        this.template = template;
        this.mods = {
          ...mods,
          escape,
          json: (value) => JSON.stringify(value)
        };
      }
      getValue(raw, data2) {
        const [key, ...mods] = raw.split("|").map((item) => item.trim());
        let value = deepClone(data2);
        for (const segment of key.split(".")) {
          if (!util.hasOwn(value, segment)) {
            return;
          }
          value = value[segment];
        }
        for (const mod of mods) {
          if (!util.hasOwn(this.mods, mod)) {
            return;
          }
          value = this.mods[mod](value);
        }
        return value;
      }
      renderFragment(fragment, data2) {
        const logicTagRe = /\{\{\s*(if|unless)\s+([\w.]+)\s*}}([\s\S]+?)(?:\{\{\s*else\s+\2\s*}}([\s\S]+?))?\{\{\s*\/\1\s+\2\s*}}|\{\{\s*each\s+([\w.]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\s*}}([\s\S]+?)\{\{\s*\/each\s+\5\s*}}/g;
        const valueTagRe = /\{\{=\s*([\w.]+(?:\s*\|\s*\w+)*)\s*}}/g;
        return fragment.replace(
          logicTagRe,
          (_, conditionType, conditionTargetVar, conditionFragment, conditionElseFragment, loopTargetVar, loopAliasValue, loopAliasKey, loopFragment) => {
            const value = this.getValue(conditionTargetVar != null ? conditionTargetVar : loopTargetVar, data2);
            const hasValue = util.isObject(value) ? !util.isEmpty(value) : !!value;
            if (conditionType) {
              const shouldRender = hasValue ? conditionType === "if" : conditionType === "unless";
              if (shouldRender) {
                return this.renderFragment(conditionFragment, data2);
              }
              if (conditionElseFragment) {
                return this.renderFragment(conditionElseFragment, data2);
              }
              return "";
            }
            let output = "";
            if (util.isObject(value)) {
              for (const [objKey, objValue] of Object.entries(value)) {
                data2[loopAliasValue] = objValue;
                if (loopAliasKey) {
                  data2[loopAliasKey] = objKey;
                }
                output += this.renderFragment(loopFragment, data2);
              }
              delete data2[loopAliasKey];
              delete data2[loopAliasValue];
            }
            return output;
          }
        ).replace(valueTagRe, (_, raw) => this.getValue(raw, data2));
      }
      render(data2) {
        return this.cleanTemplate(this.renderFragment(this.template, data2));
      }
      cleanTemplate(rawHtml) {
        return rawHtml.split(/(<pre[\s\S]*?<\/pre>|\n)/).map((item) => item.trim()).filter(Boolean).join("\n").trim();
      }
    }

    if (typeof window !== "undefined" && window.UIkit) {
      window.UIkit.component("liveSearch", Component);
    }

    return Component;

}));
