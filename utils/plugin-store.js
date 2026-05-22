const pluginMap = new Map()

export function setPlugin(name, data) {
  pluginMap.set(name, data)
}

export function getPlugin(name) {
  return pluginMap.get(name)
}
