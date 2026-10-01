import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildResultOverview,resultOverviewDescription,resultStatusLabel,formatResponseCoverage} from '../packages/experience/result-overview.js';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const current=await read('data/current.json');
const policy=await read(current.quizExperience.path);
const html=await readFile(new URL('apps/quiz/index.html',root),'utf8');
const app=await readFile(new URL('apps/quiz/app.js',root),'utf8');
assert.deepEqual(policy.routes.map(({id,size})=>({id,size})),[
 {id:'quick',size:64},{id:'standard',size:120},{id:'full',size:249}]);
assert.equal(policy.privacy.defaultAnswerSubmission,false);
assert.equal(policy.questionnairePolicy.normalizeToIdeologyPercentages,false);
assert.match(html,/id="result-at-a-glance"/);
assert.match(html,/id="domain-map"/);
assert.match(html,/id="result-nav"/);
assert.match(html,/Illustrative example with fictional answers/);
assert.match(html,/>Your worldview map</);
assert.match(html,/Each bar counts interpretations by evidence state/);
assert.match(app,/buildResultOverview\(summary\)/);
assert.match(app,/formatResponseCoverage\(quiz\.session\)/);
assert.doesNotMatch(html,/\d+% (?:match|compatible)/i);
assert.doesNotMatch(app,/exact-proposition and source-link review gate/);

const row=(id,status,domainId='one',extra={})=>({id,status,domainId,proposition:id+' exact proposition',
 inferenceStatus:'direct',propositionBasis:'explicit_rule_proposition',presentationReview:{state:'eligible'},...extra});
const supported=row('support','supported'),opposed=row('oppose','opposed'),mixed=row('mixed','mixed_context_dependent');
const inherited=row('legacy','supported','one',{proposition:null,propositionBasis:'inherited_rule_scope',
 presentationReview:{state:'inherited_rule_scope'}});
const review=row('review','supported','two',{displayState:'model_review_required'});
const missing=row('missing','not_measured','two');
const summary={schemaVersion:'quiz-summary-3',rows:[supported,opposed,mixed,inherited,review,missing],domains:[
 {id:'one',rows:[supported,opposed,mixed,inherited]},{id:'two',rows:[review,missing]}]};
const overview=buildResultOverview(summary);
assert.deepEqual(overview.supported.map(r=>r.id),['support']);
assert.deepEqual(overview.opposed.map(r=>r.id),['oppose']);
assert.deepEqual(overview.mixed.map(r=>r.id),['mixed']);
assert.deepEqual(overview.provisionalPatterns.map(r=>r.id),['legacy','review']);
assert.equal(overview.domains[0].counts.review_required,1);
assert.equal(overview.domains[1].counts.review_required,1);
assert.equal(overview.domains[1].counts.not_measured,1);
assert.equal(overview.domains[1].assessed,1);
assert.equal(overview.unmeasured[0].id,'two');
assert.equal(buildResultOverview({...summary,schemaVersion:'quiz-summary-1'}),null);
assert.match(resultOverviewDescription(overview),/specific propositions, not an overall philosophy label/);
assert.match(resultOverviewDescription({...overview,supported:[],opposed:[],mixed:[]}),/patterns remain provisional/);
assert.match(resultOverviewDescription({...overview,supported:[],opposed:[],mixed:[],provisionalPatterns:[]}),/No direct proposition is ready to highlight/);
assert.equal(resultStatusLabel({status:'not_measured',presentationReview:{state:'inherited_rule_scope'},statusLabel:'old internal copy'}),'Not measured here');
assert.match(resultStatusLabel({status:'supported',presentationReview:{state:'inherited_rule_scope'}}),/Provisional answer pattern/);
assert.match(resultStatusLabel({status:'supported',presentationReview:{state:'source_claim_unresolved'}}),/Provisional interpretation.*source link not recorded/);
assert.equal(resultStatusLabel({status:'supported',displayState:'model_review_required'}),'Provisional derived interpretation');
assert.equal(formatResponseCoverage({responses:[{state:'answered'},{state:'no_view'},{state:'not_understood'},{state:'not_applicable'}],presentedItems:[{skippedByBranch:true}]}),
 'Responses recorded: 1 substantive · 1 no view · 1 not understood · 1 not applicable · 1 conditional question not asked');
console.log('Current consumer experience contract and evidence projection passed.');
