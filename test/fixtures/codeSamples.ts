export const rawCode = `let circlePositions = []; // 2D array: circlePositions[i] = [x, y]

function preload(){
  // preload assets
}

function setup() {
  // width, height of output
  createCanvas(400, 400);

  const cx = width * 0.5;
  const cy = height * 0.5;
  const ringRadius = 120;
  const count = 24;

  circlePositions = [];
  for (let i = 0; i < count; i++) {
    const a = (TWO_PI * i) / count;
    const x = cx + cos(a) * ringRadius;
    const y = cy + sin(a) * ringRadius;
    circlePositions.push([x, y]);
  }
}

function draw() {
  // background color 0 = black
  background(0);

  noStroke();
  fill(255);

  const r = 14;
  for (let i = 0; i < circlePositions.length; i++) {
    const x = circlePositions[i][0];
    const y = circlePositions[i][1];
    circle(x, y, r * 2);
  }
}
  
function newFunction() {
}`;

export const highlightJSCode = `<pre><code class="hljs language-javascript"><span class="hljs-keyword">let</span> circlePositions = []; <span class="hljs-comment">// 2D array: circlePositions[i] = [x, y]</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">preload</span>(<span class="hljs-params"></span>){
  <span class="hljs-comment">// preload assets</span>
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">setup</span>(<span class="hljs-params"></span>) {
  <span class="hljs-comment">// width, height of output</span>
  <span class="hljs-title function_">createCanvas</span>(<span class="hljs-number">400</span>, <span class="hljs-number">400</span>);

  <span class="hljs-keyword">const</span> cx = width * <span class="hljs-number">0.5</span>;
  <span class="hljs-keyword">const</span> cy = height * <span class="hljs-number">0.5</span>;
  <span class="hljs-keyword">const</span> ringRadius = <span class="hljs-number">120</span>;
  <span class="hljs-keyword">const</span> count = <span class="hljs-number">24</span>;

  circlePositions = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; count; i++) {
    <span class="hljs-keyword">const</span> a = (<span class="hljs-variable constant_">TWO_PI</span> * i) / count;
    <span class="hljs-keyword">const</span> x = cx + <span class="hljs-title function_">cos</span>(a) * ringRadius;
    <span class="hljs-keyword">const</span> y = cy + <span class="hljs-title function_">sin</span>(a) * ringRadius;
    circlePositions.<span class="hljs-title function_">push</span>([x, y]);
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">draw</span>(<span class="hljs-params"></span>) {
  <span class="hljs-comment">// background color 0 = black</span>
  <span class="hljs-title function_">background</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">noStroke</span>();
  <span class="hljs-title function_">fill</span>(<span class="hljs-number">255</span>);

  <span class="hljs-keyword">const</span> r = <span class="hljs-number">14</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; circlePositions.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">const</span> x = circlePositions[i][<span class="hljs-number">0</span>];
    <span class="hljs-keyword">const</span> y = circlePositions[i][<span class="hljs-number">1</span>];
    <span class="hljs-title function_">circle</span>(x, y, r * <span class="hljs-number">2</span>);
  }
}
  
<span class="hljs-keyword">function</span> <span class="hljs-title function_">newFunction</span>(<span class="hljs-params"></span>) {
}</code></pre>`;
