/*
 * Copyright DevB Inc All Rights Reserved.
 * www.devb.com
 * Author: devb
 * SPDX-License-Identifier: GPL Limited
 */
'use strict'

module.exports = async (fastify, opts) => {
  fastify.get('/', async (request, reply) => {
    return reply.view('index.hbs')
  })
}