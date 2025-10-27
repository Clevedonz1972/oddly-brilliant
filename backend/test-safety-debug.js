const { LocalAnalyzer } = require('./dist/services/ai/safety/analyzers/LocalAnalyzer');

async function test() {
  const analyzer = new LocalAnalyzer();
  
  const tests = [
    'This is fucking terrible',
    'I hate these disgusting people they are subhuman',
    'I want to kill myself'
  ];
  
  for (const content of tests) {
    console.log('\n---');
    console.log('Content:', content);
    const result = await analyzer.analyze(content);
    console.log('Overall Score:', result.overallScore);
    console.log('Categories:', result.categories);
    console.log('Confidence:', result.confidence);
    console.log('Would be flagged (>0.6)?:', result.overallScore > 0.6);
  }
}

test().catch(console.error);
