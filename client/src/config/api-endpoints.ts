import {getApiUrl} from "./env"

export const AUTH_API_ENDPOINTS = {
    nonce: getApiUrl("auth/nonce"),
    verify: getApiUrl("auth/verify"),
    refresh: getApiUrl("auth/refresh")
} as const

export const USER_API_ENDPOINTS = {
    me: getApiUrl('user/me'),
    usernameUpdate: getApiUrl('username/update'),
    userImageUpdate: getApiUrl('user-image/update'),
    userImageRemove: getApiUrl('user-image/remove'),
    toggleFavoriteDAO: (daoId: number) => getApiUrl(`user/favorites/daos/${daoId}/toggle`), // Added
    getUserRewards: getApiUrl('my-rewards')
} as const


export const CAMPAIGN_API_ENDPOINTS = {
    campaign: getApiUrl('campaigns'),
    myCampaigns: getApiUrl('my-campaigns'),
    createCampaign: getApiUrl('campaigns/create'),
    createCampaignVerified: getApiUrl('campaigns/create-verified'),
    campaignOverview: getApiUrl('campaigns-overview') // Added new endpoint
} as const


export const DASHBOARD_API_ENDPOINTS = {
    statsOverview: getApiUrl('statistics/overview'),
    topShillers: getApiUrl("top-shillers"),
    campaignsGraph: getApiUrl('campaigns-graph'),
    rewardsGraph: getApiUrl("rewards-graph"),
    tierGraph: getApiUrl('tier-graph')
} as const

export const TASK_API_EDNPOINTS = {
    listTasks: getApiUrl('tasks'),
    submitTask: getApiUrl('task/submit'),
    tasksByCampaign: (campaignId: string | number) => getApiUrl(`campaigns/${campaignId}/tasks`),
    createTask: getApiUrl('tasks/create')
}

export const SUBMISSIONS_API_ENDPOINTS = {
    submissionsHistory: getApiUrl('submissions-history'),
    submissionsOverview: getApiUrl("submissions-overview"),
}

export const GRADING_API_ENDPOINTS = {
    submissionsHistoryModeration: getApiUrl("moderation/submissions-history"),
    gradeSubmission: (id: number) => getApiUrl(`moderation/submission/${id}/grade`)
}

export const topShillersExtended = getApiUrl('top-shillers-extended')


export const DAO_API_ENDPOINTS = {
    daoList: getApiUrl('dao-view'),
    favoriteDaoList: getApiUrl('favorite-daos'),
    mostActiveDaoList: getApiUrl('most-active-daos'),
    registerDao: getApiUrl('register-dao'),
    editDao: (id: number) => getApiUrl(`edit-dao/${id}`),
    deleteDao: (id: number) => getApiUrl(`edit-dao/${id}`), // Added for deleting DAO
    myDaos: getApiUrl('my-daos')
}
