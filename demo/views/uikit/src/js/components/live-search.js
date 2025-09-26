import {
    $,
    $$,
    append,
    attr,
    data,
    each,
    hasOwn,
    html as innerHtml,
    isArray,
    isEmpty,
    isFunction,
    isNumber,
    isObject,
    isPlainObject,
    isString,
    on,
    once,
    pointerCancel,
    pointerDown,
    pointerUp,
    remove,
    removeAttr,
    startsWith,
} from "uikit-util";
import Togglable from "../mixin/togglable";
import I18n from "../mixin/i18n";
import {generateId} from "../api/instance";
import {maybeDefaultPreventClick} from "../mixin/event";
import {keyMap} from "../util/keys";

export default {
    mixins: [I18n, Togglable],

    i18n: {
        enterKeyHint: "Search",
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
        caseInsensitive: Boolean,
    },

    data: {
        target: "#uk-live-search-result",
        selInput: "input[type=\"search\"]",
        selSpinner: ".uk-spinner",
        selControl: ".uk-live-search-control",
        selTrackLink: "a[href]:not([href=\"\"], [href=\"#\"])",
        template: "#uk-live-search-template",
        attrName: "uk-live-search-command",
        historyStorageKey: "live-search",
        historyLimit: 50,
        historyDisplayLimit: 10,
        popular: false,
        timeout: 10000,
        cache: true,
        caseInsensitive: true,
    },

    computed: {
        target: ({target}) => $(target),

        input: ({selInput}, $el) => $(selInput, $el),

        spinner: ({selSpinner}, $el) => $(selSpinner, $el),

        controls: ({selControl}, $el) => $$(selControl, $el),

        popular: ({popular}) => {
            if (!popular) {
                return false;
            }

            if (startsWith(popular, "[")) {
                try {
                    return JSON.parse(popular);
                } catch (e) {
                    // noop
                }
            }

            return popular.split(/\s*,\s*/);
        },
    },

    watch: {
        target(target) {
            this.offDrop?.();

            const el = target.closest(".uk-drop, .uk-dropdown");
            this.drop = this.$getComponent(el, "drop") ?? this.$getComponent(el, "dropdown");

            this.offDrop = on(el, "show hide", () => {
                queueMicrotask(() => {
                    removeAttr(this.drop.targetEl, "aria-expanded");
                    attr(this.input, "aria-expanded", this.drop.isToggled());
                });
            }, {
                self: true,
            });

            const id = generateId(this, el);

            attr(el, {
                id,
                role: "region",
                "aria-live": "polite",
            });

            attr(this.input, {
                "aria-controls": id,
                "aria-haspopup": true,
                "aria-expanded": false,
            });
        },

        spinner() {
            this.toggleSpinner(this.isProcessing, false);
        },

        controls() {
            this.toggleControls(this.getValue(), false);
        },
    },

    connected() {
        attr(this.input, {
            autocorrect: "off",
            autocomplete: "off",
            autocapitalize: "off",
            spellcheck: false,
            inputmode: "search",
            enterkeyhint: this.t("enterKeyHint"),
        });

        this.inputCommand = data(this.input, this.attrName) ?? "search:merge:debounce.400 {}";

        this.prevInputValue = this.getValue();

        this.history = new History(this.historyStorageKey, this.historyLimit, this.caseInsensitive);

        const template = new Template(innerHtml(this.template));
        this.getHtml = data => template.render(data);

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
                this.controls.filter(el => toggle !== this.isToggled(el)),
                toggle,
                animate,
            );
        },

        toggleDrop(toggle) {
            toggle = !!toggle;

            if (toggle !== this.drop.isToggled()) {
                toggle ? this.drop.show(this.$el, false) : this.drop.hide(false);
            }
        },

        syncFormParams: (() => {
            let elements = [];

            return function (searchParams) {
                const addInputs = (obj, path) => {
                    for (const [key, value] of Object.entries(obj)) {
                        if (value === null || key === this.input.name) {
                            continue;
                        }

                        const name = path ? `${path}[${key}]` : key;

                        if (isArray(value) || isPlainObject(value)) {
                            addInputs(value, name);
                        } else {
                            const element = append(
                                this.input.form,
                                `<input type="hidden" name="${escape(name)}" value="${escape(value)}"/>`,
                            );

                            elements.push(element);
                        }
                    }
                };

                remove(elements);
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

            this.cancelRequest = reason => {
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
                    this.timeout + debounce,
                );
            }

            try {
                if (debounce) {
                    await delayBeforeFetch(debounce, abortController.signal);
                }

                const {method, action} = this.input.form;

                const formData = new FormData(this.input.form);
                formData.set("live-search", true);

                const options = {
                    signal: abortController.signal,
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

        updateState: (() => {
            let cache = [];

            return async function (searchParams, commandObj) {
                delete this.pendingCommand;

                this.cancelRequest?.(Reasons.STALE);

                this.syncFormParams(searchParams);

                const hasParams = !isEmpty(searchParams);

                this.toggleControls(hasParams);

                let html;

                if (hasParams) {
                    const item = cache.find(item => isDeepEqual(item.searchParams, searchParams));

                    if (item) {
                        html = item.html;
                    } else {
                        try {
                            this.isProcessing = true;

                            html = await this.sendRequest(searchParams, commandObj);

                            if (this.cache) {
                                cache.push({searchParams, html});
                            }
                        } catch ({isAbort, reason}) {
                            if (isAbort && reason === Reasons.STALE) {
                                return;
                            }

                            const command = Command.stringify(deepMerge(commandObj, {
                                mods: {
                                    force: true,
                                    debounce: false,
                                },
                            }));

                            this.pendingCommand = command;

                            if (isAbort && reason === Reasons.CANCEL) {
                                this.isProcessing = false;

                                this.toggleSpinner(false);

                                return;
                            }

                            let data = {
                                isError: true,
                                searchParams,
                                command,
                            };

                            if (isAbort && reason === Reasons.TIMEOUT) {
                                data.isTimeout = true;
                                data.timeout = this.timeout;
                            }

                            html = this.getHtml(data);
                        }
                    }
                } else {
                    html = this.getHtml({
                        history: this.history.queries.slice(0, this.historyDisplayLimit),
                        popular: this.popular,
                    });
                }

                this.isProcessing = false;

                this.toggleSpinner(false);

                innerHtml(this.target, html);

                this.toggleDrop(true);
            };
        })(),

        dispatchCommand: (() => {
            let prevCmdData = {};

            return function (command) {
                const commandObj = Command.parse(command);

                let {base, mods, value} = commandObj;

                const isValid = value
                    ? base === "search" || base === "history.remove"
                    : base === "input.clear" || base === "history.clear";

                if (!isValid) {
                    return;
                }

                if (mods.focus) {
                    this.input.focus();
                }

                let searchParams = {};

                let cmdData = {base, value};

                if (base === "search") {
                    const key = this.input.name;

                    if (startsWith(value, "\"") || startsWith(value, "{")) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            // noop
                        }
                    }

                    if (isPlainObject(value)) {
                        searchParams = value;

                        if (hasOwn(searchParams, key)) {
                            const paramValue = searchParams[key];

                            if (!isString(paramValue) && !isNumber(paramValue)) {
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

                    if (mods.merge && !isEmpty(searchParams)) {
                        searchParams = deepMerge(prevCmdData.value, searchParams);
                    }

                    cmdData.value = deepClone(searchParams);
                }

                if ((base !== "search" || !mods.force) && isDeepEqual(cmdData, prevCmdData)) {
                    return;
                }

                prevCmdData = cmdData;

                if (base === "search" || base === "input.clear") {
                    this.input.value = value ?? "";
                } else if (base === "history.remove") {
                    this.history.remove(value);
                } else if (base === "history.clear") {
                    this.history.clear();
                }

                this.updateState(searchParams, commandObj);
            };
        })(),
    },

    events: [
        {
            name: "click",

            el: ({$el, target}) => [$el, target],

            delegate: ({attrName}) => `[${attrName}], [data-${attrName}]`,

            handler(e) {
                if (e.target.closest("a, button")) {
                    maybeDefaultPreventClick(e);

                    this.dispatchCommand(data(e.current, this.attrName));
                }
            },
        },

        {
            name: "click",

            el: ({target}) => target,

            delegate: ({selTrackLink}) => selTrackLink,

            handler() {
                this.history.add(this.input.value);
            },
        },

        {
            name: "submit",

            el: ({input}) => input.form,

            handler() {
                this.history.add(this.input.value);
            },
        },

        {
            name: "input",

            el: ({input}) => input,

            handler() {
                const value = this.getValue();

                const isEqual = this.caseInsensitive
                    ? value.toLowerCase() === this.prevInputValue.toLowerCase()
                    : value === this.prevInputValue;

                if (!isEqual) {
                    this.prevInputValue = value;

                    this.dispatchCommand(this.inputCommand);
                }
            },
        },

        {
            name: "focus keydown",

            el: ({input}) => input,

            handler(e) {
                const {key} = e;
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
            },
        },

        {
            name: "keydown",

            el: () => document,

            handler(e) {
                if (e.keyCode === keyMap.ESC) {
                    this.cancelRequest?.(Reasons.CANCEL);
                }
            },
        },

        {
            name: pointerDown,

            el: () => document,

            handler({target}) {
                if (this.drop.$el.contains(target) || this.drop.targetEl?.contains(target)) {
                    return;
                }

                once(document, [pointerUp, pointerCancel, "scroll"], e => {
                    if (e.type === pointerUp && e.target === target) {
                        this.cancelRequest?.(Reasons.CANCEL);
                    }
                }, true);
            },
        },
    ],
};

const Command = {
    parse(rawCommand) {
        let [command, value] = rawCommand.trim().split(/\s+([\s\S]+)/, 2);

        let [base, ...rawMods] = command.split(":");

        let mods = {};

        for (const mod of rawMods) {
            let [key, value = true] = mod.split(".");

            try {
                value = JSON.parse(value);
            } catch (e) {
                // noop
            }

            if (value === true || (isString(value) && value) || isNumber(value)) {
                mods[key] = value;
            }
        }

        return {base, mods, value};
    },

    stringify(commandObj) {
        const {base, mods, value} = commandObj;

        let command = [base];

        for (const [key, value] of Object.entries(mods)) {
            if (value === true || (isString(value) && value) || isNumber(value)) {
                command.push(value === true ? key : `${key}.${value}`);
            }
        }

        command = command.join(":");

        if ((isString(value) && value) || isNumber(value)) {
            command += ` ${value}`;
        }

        return command;
    },
};

function escape(value) {
    return new Option(value).innerHTML.replace(/"/g, "&quot;");
}

const Reasons = {
    STALE: "stale",
    TIMEOUT: "timeout",
    CANCEL: "cancel",
    IMMEDIATE: "immediate",
};

function delayBeforeFetch(delay, signal) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);

        once(signal, "abort", () => {
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

            ...options,
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

    if (isArray(a)) {
        return isArray(b)
            && a.length === b.length
            && a.every((value, index) => isDeepEqual(value, b[index]));
    }

    if (isPlainObject(a)) {
        return isPlainObject(b)
            && Object.keys(a).length === Object.keys(b).length
            && each(a, (value, key) => isDeepEqual(value, b[key]));
    }

    return false;
}

function deepMerge(...sources) {
    const result = {};

    for (const source of sources.filter(isPlainObject)) {
        for (const [key, value] of Object.entries(source)) {
            if (isArray(value)) {
                result[key] = value.map(item => isPlainObject(item) ? deepMerge({}, item) : item);
            } else if (isPlainObject(value)) {
                result[key] = deepMerge(isPlainObject(result[key]) ? result[key] : {}, value);
            } else {
                result[key] = value;
            }
        }
    }

    return result;
}

function deepClone(value) {
    if (isFunction(structuredClone)) {
        return structuredClone(value);
    }

    if (isArray(value)) {
        return value.map(item => deepClone(item));
    }

    if (isPlainObject(value)) {
        return deepMerge({}, value);
    }

    return value;
}

class History {
    constructor(storageKey, limit, caseInsensitive) {
        try {
            this.storage = localStorage;
        } catch (e) {
            // noop
        }

        this.storageKey = storageKey;
        this.limit = limit;
        this.caseInsensitive = caseInsensitive;
    }

    get queries() {
        try {
            const queries = JSON.parse(this.storage.getItem(this.storageKey));

            if (isArray(queries)) {
                return queries;
            }
        } catch (e) {
            // noop
        }

        return [];
    }

    set queries(value) {
        this.storage?.setItem(this.storageKey, JSON.stringify(value));
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
        const queries = this.queries.filter(item =>
            this.caseInsensitive
                ? item.toLowerCase() !== value.toLowerCase()
                : item !== value,
        );

        if (isEmpty(queries)) {
            this.clear();

            return;
        }

        this.queries = queries;
    }

    clear() {
        this.storage?.removeItem(this.storageKey);
    }
}

class Template {
    constructor(template, mods = {}) {
        this.template = template;
        this.mods = {
            ...mods,

            escape: escape,
            json: value => JSON.stringify(value),
        };
    }

    getValue(raw, data) {
        const [key, ...mods] = raw.split("|").map(item => item.trim());

        let value = deepClone(data);

        for (const segment of key.split(".")) {
            if (!hasOwn(value, segment)) {
                return;
            }

            value = value[segment];
        }

        for (const mod of mods) {
            if (!hasOwn(this.mods, mod)) {
                return;
            }

            value = this.mods[mod](value);
        }

        return value;
    }

    renderFragment(fragment, data) {
        const logicTagRe = /\{\{\s*(if|unless)\s+([\w.]+)\s*}}([\s\S]+?)(?:\{\{\s*else\s+\2\s*}}([\s\S]+?))?\{\{\s*\/\1\s+\2\s*}}|\{\{\s*each\s+([\w.]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\s*}}([\s\S]+?)\{\{\s*\/each\s+\5\s*}}/g;
        const valueTagRe = /\{\{=\s*([\w.]+(?:\s*\|\s*\w+)*)\s*}}/g;

        return fragment
            .replace(
                logicTagRe,
                (
                    _,
                    conditionType,
                    conditionTargetVar,
                    conditionFragment,
                    conditionElseFragment,
                    loopTargetVar,
                    loopAliasValue,
                    loopAliasKey,
                    loopFragment,
                ) => {
                    const value = this.getValue(conditionTargetVar ?? loopTargetVar, data);

                    const hasValue = isObject(value) ? !isEmpty(value) : !!value;

                    if (conditionType) {
                        const shouldRender = hasValue ? conditionType === "if" : conditionType === "unless";

                        if (shouldRender) {
                            return this.renderFragment(conditionFragment, data);
                        }

                        if (conditionElseFragment) {
                            return this.renderFragment(conditionElseFragment, data);
                        }

                        return "";
                    }

                    let output = "";

                    if (isObject(value)) {
                        for (const [objKey, objValue] of Object.entries(value)) {
                            data[loopAliasValue] = objValue;

                            if (loopAliasKey) {
                                data[loopAliasKey] = objKey;
                            }

                            output += this.renderFragment(loopFragment, data);
                        }

                        delete data[loopAliasKey];
                        delete data[loopAliasValue];
                    }

                    return output;
                },
            )
            .replace(valueTagRe, (_, raw) => this.getValue(raw, data));
    }

    render(data) {
        return this.cleanTemplate(this.renderFragment(this.template, data));
    }

    cleanTemplate(rawHtml) {
        return rawHtml
            .split(/(<pre[\s\S]*?<\/pre>|\n)/)
            .map(item => item.trim())
            .filter(Boolean)
            .join("\n")
            .trim();
    }
}