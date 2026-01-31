let globalId = 0;
let globalParent;
const componentState = new Map()
// parent will the key of the data map

export function useState(initialState) {
  const id = globalId
  const parent = globalParent
  globalId++;

  return (() => {
    // the parent inside will never change
    const { cache } = componentState.get(parent)
    if (cache[id] == null) {
      cache[id] = { value: typeof initialState === "function" ? initialState() : initialState }
    }

    const setState = state => {
      const { props, component } = componentState.get(parent)

      if (typeof state === "function") {
        cache[id].value = state(cache[id].value)
      } else {
        cache[id].value = state
      }

      render(component, props, parent)
    }

    return [cache[id].value, setState]
  })()
}

export function useEffect(callback, dependencies) {
  const id = globalId
  const parent = globalParent
  globalId++;

  (() => {
    // the parent inside will never change
    const { cache } = componentState.get(parent)
    if (cache[id] == null) {
      cache[id] = { dependencies: undefined }
    }

    const dependenciesChanged = dependencies == null || dependencies.some((dependency, i) => {
      return cache[id].dependencies == null || cache[id].dependencies[i] !== dependency
    })

    if (dependenciesChanged) {
      if (cache[id].cleanup != null) cache[id].cleanup()
      cache[id].cleanUp = callback()
      cache[id].dependencies = dependencies;
    }
  })()
}

export function useMemo(callback, dependencies) {
  const id = globalId
  const parent = globalParent
  globalId++;

  return (() => {
    // the parent inside will never change
    const { cache } = componentState.get(parent)
    if (cache[id] == null) {
      cache[id] = { dependencies: undefined }
    }

    const dependenciesChanged = dependencies == null || dependencies.some((dependency, i) => {
      return cache[id].dependencies == null || cache[id].dependencies[i] !== dependency
    })

    if (dependenciesChanged) {
      cache[id].value = callback()
      cache[id].dependencies = dependencies;
    }

    return cache[id].value
  })()
}

export function render(component, props, parent) {
  const state = componentState.get(parent) || { cache: [] }
  componentState.set(parent, { ...state, component, props })
  globalParent = parent
  const output = component(props)
  globalId = 0; // reset to 0 so the next render will fresh ids 
  parent.innerHTML = output;
}
