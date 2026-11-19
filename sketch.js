let bgImage; // 儲存城堡背景圖片
let bgScrollX = 0; // 記錄背景目前的水平捲動偏移量

let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

function preload() { // 在畫布建立前載入圖片
  bgImage = loadImage("bg/bg.jpg"); // ⚠️ 請確認路徑與你的圖片檔名一致（如 bg.png 或 bg.jpg）
  characterSprite = loadImage("1/stop/stop.png"); // 載入角色一的十格精靈圖
  walkSprite = loadImage("1/walk/walk.png"); // 載入角色一的九格走路精靈圖
  magicSprite = loadImage("1/magic/magic.png"); // 載入角色一的四格施法精靈圖
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png"); // 載入五格魔法特效精靈圖
}

function setup() { // 初始化畫布與繪圖模式
  createCanvas(windowWidth, windowHeight); // 建立符合視窗尺寸的畫布
  imageMode(CENTER); // 讓角色座標代表影格的中心點
  characterX = width / 2; // 將角色初始位置設在畫布正中央
  frameRate(60); // 將動畫更新速率設定為每秒六十格
}

function draw() { // 每個畫面更新一次背景與角色
  // --- 1. 計算移動與背景捲動 ---
  const movingRight = keyIsDown(RIGHT_ARROW); // 檢查右方向鍵目前是否按住
  const movingLeft = keyIsDown(LEFT_ARROW); // 檢查左方向鍵目前是否按住
  isWalking = movingRight || movingLeft; // 沒有按住左右鍵時切回站立動畫
  const movementStep = constrain(width * 0.004, 2, 8); // 依畫布寬度計算移動速度

  // 計算背景等比例鋪滿畫布高度後的寬度
  const bgScale = height / bgImage.height;
  const scaledBgWidth = bgImage.width * bgScale;

  // 設定畫面捲動邊界（角色走到畫布左側 25% 或右側 75% 時，改由背景捲動延伸）
  const leftMargin = width * 0.25;
  const rightMargin = width * 0.75;

  if (movingRight) { // 按住右方向鍵
    isWalking = true;
    facingDirection = 1;
    if (characterX < rightMargin) {
      characterX += movementStep; // 還沒到右側邊界前，角色在畫面上移動
    } else {
      bgScrollX -= movementStep; // 到達右側邊界後，背景向左捲動（視覺上角色繼續向右探索）
    }
  } else if (movingLeft) { // 按住左方向鍵
    isWalking = true;
    facingDirection = -1;
    if (characterX > leftMargin) {
      characterX -= movementStep; // 還沒到左側邊界前，角色在畫面上移動
    } else {
      bgScrollX += movementStep; // 到達左側邊界後，背景向右捲動（視覺上角色繼續向左探索）
    }
  }

  // --- 2. 繪製無限延伸的背景 ---
  push();
  imageMode(CORNER); // 切換為左上角對齊，方便計算拼接位置
  // 利用取餘數 (%) 讓偏移量永遠保持在一個背景寬度內循環
  let startX = bgScrollX % scaledBgWidth;
  if (startX > 0) {
    startX -= scaledBgWidth; // 確保往左捲動時左邊界不會出現空隙
  }
  // 從 startX 開始連續畫出背景，直到填滿整個畫布寬度為止
  for (let x = startX; x < width; x += scaledBgWidth) {
    image(bgImage, x, 0, scaledBgWidth, height);
  }
  pop();

  // --- 3. 計算角色 1/3 高度與等比例寬度 ---
  const targetHeight = height / 3; // 角色高度固定為畫布高度的 1/3
  const characterScale = targetHeight / frameHeight; // 依據原圖高度計算等比例縮放倍率
  const characterWidth = frameWidth * characterScale; // 依原圖比例計算角色寬度
  const characterHeight = targetHeight;

  // 確保角色不會超出畫布左右邊界
  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // --- 4. 處理施法與魔法特效 ---
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  // --- 5. 繪製角色動畫 ---
  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;

  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting
    ? floor(elapsedMagicFrames / framesPerStep)
    : floor(frameCount / framesPerStep) % activeFrameCount;

  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2; // 角色底部貼齊畫布底部（也可依地板高度微調，例如 height * 0.92 - activeHeight / 2）

  push();
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  // --- 6. 更新與繪製魔法特效 ---
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);

  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight);
    pop();
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}