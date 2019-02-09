import { createHash } from 'crypto'
import { readdir, statSync } from 'fs-extra'
import { DateTime } from 'luxon'
import { homedir } from 'os'
import { resolve } from 'path'
import { filenamifyUrl } from '..'
import { IMetadata } from '../core/VMetadata'

export const dataURLPattern = /^data:[\w\/\+]+(?:;.*)?,/

export function extractExtensionFromURL(url: string) {
    const m = url.match(/['"]?[^?#]+\.(\w+)(?:['"]?$|\?|#)/)
    return m ? m[1] : null
}

export async function newFilePath(directory: string, basename: string, ext = 'html') {
    const fileList = await readdir(directory).catch(() => [] as string[])

    if (!fileList.includes(`${basename}.${ext}`)) {
        return resolve(directory, `${basename}.${ext}`)
    }

    const regex = new RegExp(`${basename}-(\\d+)\\.${ext}`)
    const numbers = fileList
        .map(name => name.match(regex))
        .filter((m): m is RegExpMatchArray => !!m)
        .map(m => parseInt(m[1]))

    const number = Math.max(0, ...numbers) + 1
    return resolve(directory, `${basename}-${number}.${ext}`)
}

export function outputPathFn(directory: string) {
    const outputDir = dataPath('pages', directory)
    const dateString = DateTime.local().toFormat('yyyyMMdd')

    return async (metadata: IMetadata) => {
        const basename = `${dateString}-${filenamifyUrl(metadata.url)}`
        const outputPath = await newFilePath(outputDir, basename)
        return outputPath
    }
}

export const dataDirectoryPath = (() => {
    if (process.env.NODE_ENV === 'test') {
        return resolve('tmp', '__data__')
    }

    const dataDirectoryName = '.vanilla-clipper'
    const inCurrent = resolve(process.cwd(), dataDirectoryName)
    const inHome = resolve(homedir(), dataDirectoryName)

    try {
        return statSync(inCurrent).isDirectory() ? inCurrent : inHome
    } catch (error) {
        return inHome
    }
})()

export function dataPath(...pathSegments: string[]) {
    return resolve(dataDirectoryPath, ...pathSegments)
}

export function getHash(buffer: Buffer) {
    const hash = createHash('sha256')
    hash.update(buffer)
    return hash.digest('hex')
}
