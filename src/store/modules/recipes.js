// 初始状态
const state = {
  selectedConstitution: '',
  selectedRecipe: null,
  recipes: [
    {
      name: '四神汤',
      source: '',
      suitableFor: ['脾虚', '气虚', '痰湿'],
      ingredients: [
        { name: '淮山药', amount: '15克' },
        { name: '茯苓', amount: '10克' },
        { name: '莲子', amount: '10克' },
        { name: '芡实', amount: '10克' },
        { name: '陈皮', amount: '3克' },
        { name: '生姜', amount: '3片' }
      ],
      effects: '健脾胃，补肺气，化痰湿。适用于脾胃虚弱，消化不良，腹胀，大便溏薄等症状。',
      usage: '将所有材料加水煮沸后，转小火煮约40分钟，加入适量食盐调味即可。',
      wuxingLogic: '四神汤以健脾为主，属土，茯苓、莲子化湿，山药、芡实补脾，配伍精妙。'
    },
    {
      name: '人参归脾汤',
      source: '',
      suitableFor: ['气虚', '血虚', '脾虚'],
      ingredients: [
        { name: '党参', amount: '10克' },
        { name: '白术', amount: '10克' },
        { name: '茯苓', amount: '10克' },
        { name: '黄芪', amount: '15克' },
        { name: '当归', amount: '10克' },
        { name: '龙眼肉', amount: '10克' },
        { name: '远志', amount: '6克' },
        { name: '酸枣仁', amount: '10克' },
        { name: '木香', amount: '6克' },
        { name: '甘草', amount: '6克' }
      ],
      effects: '补气养血，健脾安神。适用于气血两虚，心脾不足导致的失眠多梦，心悸健忘，食欲不振等症状。',
      usage: '水煎服，每日一剂，早晚分服。',
      wuxingLogic: '方中黄芪、党参补气属土，当归补血属木，二者相生相克，调节气血平衡。'
    }
  ]
}

// getters
const getters = {
  filteredRecipes: (state) => {
    if (!state.selectedConstitution) return state.recipes
    return state.recipes.filter(recipe => 
      recipe.suitableFor.some(type => 
        type.includes(state.selectedConstitution) || 
        state.selectedConstitution.includes(type)
      )
    )
  }
}

// mutations
const mutations = {
  SET_SELECTED_CONSTITUTION(state, constitution) {
    state.selectedConstitution = constitution
  },
  SET_SELECTED_RECIPE(state, recipe) {
    state.selectedRecipe = recipe
  },
  ADD_RECIPE(state, recipe) {
    state.recipes.push(recipe)
  },
  UPDATE_RECIPE(state, { index, recipe }) {
    state.recipes.splice(index, 1, recipe)
  },
  DELETE_RECIPE(state, index) {
    state.recipes.splice(index, 1)
  }
}

// actions
const actions = {
  selectConstitution({ commit }, constitution) {
    commit('SET_SELECTED_CONSTITUTION', constitution)
    commit('SET_SELECTED_RECIPE', null) // 清空已选择的药膳
  },
  selectRecipe({ commit }, recipe) {
    commit('SET_SELECTED_RECIPE', recipe)
  },
  addRecipe({ commit }, recipe) {
    commit('ADD_RECIPE', recipe)
  },
  updateRecipe({ commit, state }, recipe) {
    const index = state.recipes.findIndex(r => r.name === recipe.name)
    if (index !== -1) {
      commit('UPDATE_RECIPE', { index, recipe })
    }
  },
  deleteRecipe({ commit, state }, recipeName) {
    const index = state.recipes.findIndex(r => r.name === recipeName)
    if (index !== -1) {
      commit('DELETE_RECIPE', index)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} 