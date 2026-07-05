const fs = require('fs');
const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `const LiveClock = React.memo(() => {
  useEffect(() => {`,
  `const LiveClock = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {`
);

fs.writeFileSync(path, code);
