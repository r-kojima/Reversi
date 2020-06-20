"use strict"; //strictモード

// 座標やサイズを保持する、二次元ベクトルのクラス
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let message;
const boardSize = new Vec2(8, 8);
const diskColor = {
    dark: 0,
    light: 1,
    none: 2,
    max: 3
};

const diskAA = [
    '●', // dark
    '○', // light
    '・' // none
];

const diskNames = [
    '黒', // dark
    '白'  // light
];

let board; //盤面
let turn; // 現在のターンを保持

let cursorPos; //カーソルの座標

function init() {
    // 盤面の生成
    board = [];
    for (let i = 0; i < boardSize.y; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize.x; j++) {
            board[i][j] = diskColor.none;
        }
    }

    //ゲームの初期化
    board[3][4] = diskColor.dark;
    board[4][3] = diskColor.dark;
    board[3][3] = diskColor.light;
    board[4][4] = diskColor.light;
    message = '';
    cursorPos = new Vec2(0, 0);
    turn = diskColor.dark;
    draw();
    window.onkeydown = onKeyDown;
}

function draw() {
    let html = '';

    // 盤面の描画
    for (let i = 0; i < boardSize.y; i++) {
        for (let j = 0; j < boardSize.x; j++) {
            html += diskAA[board[i][j]];
        }
        // カーソルの描画
        if (i === cursorPos.y) {
            html += '←';
        }
        html += '<br>';
    }
    for (let i = 0; i < boardSize.x; i++) {
        html += (i === cursorPos.x) ? '↑' : '　';
    }
    html += '<br>';

    if(!isGameEnd()) {
        message += `${diskNames[turn]}のターンです。<br>`
        message += `<br>
            [w, s, a, d]：カーソル移動<br>
            [その他のキー]：石を置く`;
    }
    else
        message += '何かキーを押してください。';

    html += '<br>' + message;
    let div = document.querySelector('div');
    div.innerHTML = html;
}

// キーが押された時に呼ばれるイベントハンドラ
function onKeyDown(e) {
    message = '';

    if (isGameEnd()) {
        init();
        return;
    }

    // カーソル操作、石を置く
    switch (e.key) {
        case 'w': cursorPos.y--; break;
        case 's': cursorPos.y++; break;
        case 'a': cursorPos.x--; break;
        case 'd': cursorPos.x++; break;
        default:
            //石を置く
            onOtherKeyDown();
    }
    // カーソルの移動範囲の制限
    if (cursorPos.x < 0) cursorPos.x += boardSize.x;
    if (cursorPos.x >= boardSize.x) cursorPos.x -= boardSize.x;
    if (cursorPos.y < 0) cursorPos.y += boardSize.y;
    if (cursorPos.y >= boardSize.y) cursorPos.y -= boardSize.y;
    
    // 再描画
    draw();
}

// カーソルキー以外が押された時の関数
function onOtherKeyDown() {
    if (checkCanPlace(turn, cursorPos,  false)) { // 石を置けるか判定
        // 石をひっくり返す
        checkCanPlace(turn, cursorPos,  true)
        // 石を置く
        board[cursorPos.y][cursorPos.x] = turn;
        // ゲームの終了判定
        if (isGameEnd()) {
            let count = [0, 0]; //両者の石の数を保持する
            for (let i = 0; i < boardSize.x; i++) {
                for (let j = 0; j < boardSize.y; j++) {
                    if (board[i][j] !== diskColor.none)
                        count[board[i][j]]++; // 石の数を集計
                }
            }
            // 結果の作成
            message =
                diskNames[diskColor.dark] + ':'
                + count[diskColor.dark]
                + ' - '
                + diskNames[diskColor.light] + ':'
                + count[diskColor.light]
                + '<br>';
            
            // 勝者の判定
            let winner = diskColor.none;
            if (count[diskColor.dark] > count[diskColor.light])
                winner = diskColor.dark;
            else if (count[diskColor.light] > count[diskColor.dark])
                winner = diskColor.light;
            // 勝敗の表示
            if (winner !== diskColor.none)
                message += `${diskNames[winner]}の勝ちです。<br>`;
            else
                message += '引き分けです。<br>';
            message += '<br>';
            return
        }
        // ターンを切り替える
        takeTurn();
        // 相手がパスの場合
        if (!checkCanPlaceAll(turn)) {
            message += diskNames[turn] + 'はパスしました。<br>';
            takeTurn();
        }
    }
    else
       message += 'そこには置けません。<br>';
}

// ターンを切り替える関数
function takeTurn() {
    if (turn === diskColor.dark)
        turn = diskColor.light;
    else
        turn = diskColor.dark;
}

// 石が置けるかどうかの判定と、石をひっくり返す処理をする関数
function checkCanPlace(
    color,  // 石の色
    pos,    // 石を置く座標
    reverce // ひっくり返しフラグ
) {
    let result = false; // 置けるかどうかの判定

    // すでにその場所に石が置かれているかを判定
    if (board[pos.y][pos.x] !== diskColor.none)
        return false;

    // 周囲8方向への処理
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let dir = new Vec2(i, j);
            if ((dir.x === 0) && (dir.y === 0)) //中心点はスキップ
                continue;

            let checkPos = new Vec2(pos.x + dir.x, pos.y + dir.y); //原点の隣の座標を取得
            if (!isInBoard(checkPos)) //ボードの範囲外であればスキップ
                continue
            
            let opponent; //相手の石の色
            if (color === diskColor.dark)
                opponent = diskColor.light;
            else
                opponent = diskColor.dark;

            if (board[checkPos.y][checkPos.x] !== opponent) //隣が相手の石でなければスキップ
                continue;

            // 連続してマスをチェックする
            while (true) {
                // 隣のマスに移動
                checkPos.x += dir.x;
                checkPos.y += dir.y;

                if(!isInBoard(checkPos)) break; //ボードの範囲外であればスキップ
                if(board[checkPos.y][checkPos.x] === diskColor.none) break; // 石がなければスキップ

                // ひっくり返せることが確定した時
                if (board[checkPos.y][checkPos.x] === color) {
                    result = true;
                    // ひっくり返すかどうかの分岐
                    if (reverce) {
                        let revercePos = new Vec2(pos.x, pos.y);
                        while (true) {
                            // ひっくり返す座標に進む
                            revercePos.x += dir.x;
                            revercePos.y += dir.y;
                            if ((revercePos.x === checkPos.x) && (revercePos.y === checkPos.y)) 
                                break;
                            board[revercePos.y][revercePos.x] = color; // ひっくり返す
                        }
                    }
                }
            }
        }
    }

    return result;
}

// 座標がボード内に収まっているかを判定する関数
function isInBoard(v) {
    return v.x >= 0
        && v.x < boardSize.x
        && v.y >= 0
        && v.y < boardSize.y;
}

// 任意のプレイヤーが、石を置ける場所があるかどうかを判定する関数
function checkCanPlaceAll(color) {
    for (let i = 0; i < boardSize.y; i++) {
        for (let j = 0; j < boardSize.x; j++) {
            if (checkCanPlace(color, new Vec2(j, i), false))
                return true;
        }
    }
    return false;
}

function isGameEnd() {
    return (!checkCanPlaceAll(diskColor.dark)) && (!checkCanPlaceAll(diskColor.light));
}

init();