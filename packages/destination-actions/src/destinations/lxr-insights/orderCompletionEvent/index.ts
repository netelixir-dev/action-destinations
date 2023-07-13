import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Order Completion Event',
  description: 'Send order completion event',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    checkout_id: {
      label: 'Checkot ID',
      description: 'Checkout ID generated before Order Completion',
      type: 'string',
      required: false
    },
    order_id: {
      label: 'Order ID',
      description: 'Unique ID of the order',
      type: 'string',
      required: true,
      default: {
        '@template': '{{properties.order_id}}'
      }
    },
    user_id: {
      label: 'User ID',
      description: 'User ID created by the Business',
      type: 'string',
      required: true,
      default: {  // TODO: If User ID is not available pass anonymus ID here
        '@template': '{{userId}}'
      }
    },
    total: {
      label: 'Total',
      description: 'Total value of the order',
      type: 'number',
      required: true,
      default: {
        '@template': '{{properties.revenue}}' // TODO: is it going to be props.revenue or props.total?
      }
    },
    tax: {
      label: 'Tax',
      description: 'Total tax associated with the transaction',
      type: 'number',
      required: false,
      default: {
        '@template': '{{properties.tax}}'
      }
    },
    shipping: {
      label: 'Shipping',
      description: 'Total cost of shipping',
      type: 'number',
      required: false,
      default: {
        '@template': '{{properties.shipping}}'
      }
    },
    discount: {
      label: 'Discount',
      description: 'Total discount associated with the transaction',
      type: 'number',
      required: false,
      default: {
        '@template': '{{properties.discount}}'
      }
    },
    coupon: {
      label: 'Coupon',
      description: 'Transaction coupon redeemed with the transaction',
      type: 'string',
      required: false,
      default: {
        '@template': '{{properties.coupon}}'
      }
    },
    currency: {
      label: 'Currency',
      description: 'Currency of the order (e.g. USD)',
      type: 'string',
      required: false,
      default: {
        '@template': '{{properties.currency}}'
      }
    },
    products: {
      label: 'Products',
      description: 'List of product details in the order',
      type: 'object',
      required: false,
      default: {
        '@template': '{{properties.products}}'
      }
    },
    email: {
      label: 'Email address',
      description: 'Email address of the customer',
      type: 'string',
      required: false,
      default: {
        '@if': {
          else: { '@path': '$.properties.email' },
          then: { '@path': '$.context.traits.email' },
          blank: { '@path': '$.context.traits.email' }
        }
      }
    }
  },
  perform: (request, { payload }) => {
    return request('https://www.netelixer.com/domain/api/orders', {
      method: 'POST',
      json: payload
    })
  }
}

export default action
