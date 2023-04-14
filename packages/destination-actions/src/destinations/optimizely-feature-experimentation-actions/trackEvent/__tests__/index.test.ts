import nock from 'nock'
import got from 'got'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { dataFile } from '../mock-dataFile'
import { payload } from '../mock-payload'

const testDestination = createTestIntegration(Destination)

describe('OptimizelyFeatureExperimentation.trackEvent', () => {
  it('should send event successfully', async () => {
    const settings = {
      accountId: '12345566',
      dataFileUrl: 'https://cdn.example.com/dataFile.json'
    }
    nock(settings.dataFileUrl).get('').reply(200, dataFile)
    nock('https://logx.optimizely.com/v1/events').post('', payload).reply(200)

    const res = await got.post('https://logx.optimizely.com/v1/events', { json: payload })
    expect(res.statusCode).toBe(200)
  }),
    it('should throw error if event sent is not in datafile', async () => {
      const settings = {
        accountId: '12345566',
        dataFileUrl: 'https://cdn.example.com/dataFile.json'
      }
      nock(settings.dataFileUrl).get('').reply(200, dataFile)
      nock('https://logx.optimizely.com/v1/events').post('').reply(500, {})
      const event = createTestEvent({
        event: 'Error Test Event',
        properties: {
          revenue: 1000
        },
        context: {
          traits: {
            test: 'test'
          }
        }
      })
      await expect(
        testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
      ).rejects.toThrowError(`Event with name ${event.event} is not defined`)
    })
  it('should be able to send a basic track with bot filtering enabled', async () => {
    const settings = {
      accountId: '12345566',
      dataFileUrl: 'https://cdn.example.com/dataFile.json'
    }
    nock(settings.dataFileUrl).get('').reply(200, dataFile)
    dataFile.botFiltering = true
    nock('https://logx.optimizely.com/v1/events').post('').reply(200)
    const event = createTestEvent({
      event: 'Product List Clicked',
      properties: {
        revenue: 1000
      },
      context: {
        traits: {
          test: 'test'
        }
      }
    })
    await expect(
      testDestination.testAction('trackEvent', { event, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })
})
