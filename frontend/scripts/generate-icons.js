import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 아이콘 디렉토리 생성
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG 아이콘 생성 (간단한 지갑 아이콘)
const createSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.2}"/>
  <g transform="scale(${size / 24})">
    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="white"/>
  </g>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('아이콘 생성 스크립트를 실행합니다...\n');
console.log('⚠️  실제 프로덕션 환경에서는 디자인된 아이콘을 사용해주세요.\n');
console.log('다음 방법 중 하나를 선택하세요:\n');
console.log('1. 온라인 도구 사용:');
console.log('   - https://www.pwabuilder.com/ (PWA 아이콘 자동 생성)');
console.log('   - https://realfavicongenerator.net/ (Favicon 생성기)\n');
console.log('2. 디자인 도구에서 직접 제작:');
console.log('   - Figma, Adobe XD 등에서 512x512 PNG 파일 생성');
console.log('   - 온라인 리사이저로 여러 사이즈 생성\n');
console.log('3. 임시 아이콘 SVG 파일 생성 (개발용):\n');

// SVG 파일 생성
sizes.forEach(size => {
  const svgContent = createSVG(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svgContent.trim());
  console.log(`✅ 생성됨: icons/icon-${size}x${size}.svg`);
});

console.log('\n📝 참고: SVG 파일이 생성되었습니다.');
console.log('PNG 변환이 필요한 경우:');
console.log('1. https://cloudconvert.com/svg-to-png 에서 일괄 변환');
console.log('2. 또는 각 SVG를 브라우저에서 열고 스크린샷 저장\n');
