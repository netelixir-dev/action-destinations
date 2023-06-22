import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import syncEngage from './syncEngage'
import syncRetl from './syncRetl'
import createAudience from './createAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'Facebook Custom Audiences (Actions)',
  slug: 'actions-facebook-custom-audiences',
  mode: 'cloud',
  description: 'The Facebook Custom Audiences destination.',

  authentication: {
    scheme: 'oauth2',
    fields: {
      placeholder: {
        label: 'Placeholder',
        description: 'Placeholder',
        type: 'string'
      },
      adAccountID: {
        label: 'Ad Account ID',
        description: 'Ad Account ID',
        type: 'string',
        required: true,
        dynamic: true
      }
    },
    dynamicFields: {
      adAccountID: async (_request) => {
        return {
          choices: [
            {
              label: 'Test Label',
              value: 'Test_Value'
            }
          ]
        }
      }
    },
    refreshAccessToken: async () => {
      return { accessToken: 'TODO: Implement this' }
    }
  },
  actions: {
    syncEngage,
    syncRetl,
    createAudience
  }
}

export default destination
