var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var has_pnpm_exports = {};
__export(has_pnpm_exports, {
  default: () => has_pnpm_default
});
module.exports = __toCommonJS(has_pnpm_exports);
var import_execa = require("execa");
var import_promises = __toESM(require("fs/promises"), 1);
var import_path = __toESM(require("path"), 1);
var cache = /* @__PURE__ */ new Map();
var exists = (path2) => import_promises.default.stat(path2).then(
  () => true,
  () => false
);
function hasGlobalInstallation(pm) {
  const key = `has_global_${pm}`;
  if (cache.has(key)) {
    return Promise.resolve(cache.get(key));
  }
  return (0, import_execa.execa)(pm, ["--version"]).then((res) => {
    return /^\d+.\d+.\d+$/.test(res.stdout);
  }).then((value) => {
    cache.set(key, value);
    return value;
  }).catch(() => false);
}
async function checkOtherManagers(cwd) {
  const managers = ["yarn", "npm", "bun"];
  const results = await Promise.all(
    managers.map(async (manager) => {
      const lockFile = manager === "npm" ? "package-lock.json" : `${manager}.lock${manager === "bun" ? "b" : ""}`;
      const hasLock = await exists(import_path.default.join(cwd, lockFile));
      const hasGlobal = await hasGlobalInstallation(manager);
      return {
        name: manager,
        hasLock,
        hasGlobal
      };
    })
  );
  return results.filter((m) => m.hasLock || m.hasGlobal);
}
async function canPnpm(cwd = process.cwd()) {
  const pnpmLockExists = await exists(import_path.default.join(cwd, "pnpm-lock.yaml"));
  if (pnpmLockExists) {
    return { canPnpm: true, reason: "local lock file" };
  }
  const canPnpmGlobal = await hasGlobalInstallation("pnpm");
  if (canPnpmGlobal) {
    return { canPnpm: true, reason: "global installation" };
  }
  const otherManagers = await checkOtherManagers(cwd);
  return {
    canPnpm: false,
    otherManagers: otherManagers.map((m) => ({
      name: m.name,
      detected: m.hasLock ? "local lock file" : "global installation"
    }))
  };
}
var has_pnpm_default = canPnpm;
(async () => {
  try {
    const result = await canPnpm();
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  }
})();
