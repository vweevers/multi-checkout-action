'use strict'

const checkout = require.resolve('./dist/checkout.js')
const spawn = require('child_process').spawn
const fsp = require('fs').promises
const path = require('path')

async function main () {
  const items = (process.env.INPUT_REPOSITORIES || '').split(/[\r\n]+/).filter(Boolean)
  const workspace = process.env.GITHUB_WORKSPACE || '.'
  const basedir = path.resolve(workspace, process.env.INPUT_PATH || '..')
  const debug = {}
  const env = {}

  for (const k in process.env) {
    if (!/^INPUT_(REPOSITORIES|REPOSITORY|REF|PATH|PERSIST.CREDENTIALS)$/i.test(k)) {
      env[k] = process.env[k]

      if (/^INPUT_/i.test(k)) {
        debug[k] = process.env[k]
      }
    }
  }

  for (const item of items) {
    const [repository, ref, ...a] = item.split('@')
    const [owner, name, ...b] = repository.split('/')

    if (!owner || !name || a.length || b.length) {
      throw new Error('Repository must be in the form of "owner/name[@ref]"')
    }

    const dir = path.join(basedir, repository)
    const parent = path.dirname(dir)

    console.log('::group::Checkout %s', item)
    console.log(require('util').inspect({
      repository,
      ref,
      owner,
      name,
      dir,
      debug
    }, { depth: null }))

    await fsp.mkdir(parent, { recursive: true })
    await exec(process.execPath, [checkout], {
      env: {
        ...env,
        INPUT_REPOSITORY: repository,
        INPUT_REF: ref || '',
        INPUT_PATH: dir,
        'INPUT_PERSIST-CREDENTIALS': 'false',

        // Circumvent actions/checkout restriction that
        // INPUT_PATH must be under workspace
        // GITHUB_WORKSPACE: parent,

        // To be safe, unset variables that might be used as defaults
        GITHUB_REPOSITORY: '',
        GITHUB_SHA: '',
        GITHUB_REF: '',
        GITHUB_HEAD_REF: '',
        GITHUB_BASE_REF: ''
      },
      stdio: ['ignore', 1, 1]
    })

    console.log('::endgroup::')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

async function exec (command, args, options) {
  return new Promise(function (resolve, reject) {
    const cp = spawn(command, args, options)

    cp.on('error', reject)
    cp.on('close', function (code) {
      if (code !== 0) {
        reject(new Error(`Child process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}
