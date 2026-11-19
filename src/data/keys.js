// 《甄嬛传》8 位人物标准答案矩阵（v2 钥匙算法）
// 20 题标准答案，按 questions.js 顺序对应

import { simpleIndex } from './questions.js'

export const keys = {
  甄嬛: 'BDBCCCBACBCCBCBBBBCB',
  沈眉庄: 'BADBACDDACADBCCCABAD',
  安陵容: 'DDCDCABCDADACDACCCDA',
  华妃: 'ACDADBACBAAAAAADAABB',
  皇后: 'CAACABDACDBDDACADDAC',
  端妃: 'CBBBBDCBBCCBDBDBCCBD',
  叶澜依: 'ACCADDADABBCABDDBADC',
  曹琴默: 'DBADBACBDDDBCDBADDCA',
}

// 简版 key：取 Q1 Q2 Q3 Q6 Q8
export const simpleKeys = Object.fromEntries(
  Object.entries(keys).map(([n, k]) => [n, simpleIndex.map((i) => k[i]).join('')])
)
