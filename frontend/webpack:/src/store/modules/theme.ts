export const moduleTheme = {
    state: () => ({
        currentTheme: 'dark',//dark或者light
    }),
    getters: {
        //theme为light时true
        isThemeLight (state: any) {
            return state.currentTheme === 'light'
        },
    },
    mutations: {
        updateCurrentTheme(state: any,value: any) {
            state.currentTheme = value
        },
    },
    actions: {  }
}