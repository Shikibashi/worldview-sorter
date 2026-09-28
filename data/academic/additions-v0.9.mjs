// Academic definitions and original candidate items. No participant data.
export const release = {
  version: '0.9.0', registryVersion: '0.2.0', baseBankVersion: '0.8.0',
  status: 'original_candidates_not_validated', reviewedOn: '2026-09-28',
  note: 'Conceptual coverage is not evidence of latent dimensionality, reliability, or classification accuracy.'
};
const S = (id, title, url, locator, evidenceType = 'signed_scholarly_synthesis', access = 'text_reviewed') =>
  ({id, title, url, locator, evidenceType, access, itemReuse: 'No questionnaire wording copied; theory-level reference only.'});
export const sources = [
  S('acad-rand', 'Badhwar & Long: Ayn Rand', 'https://plato.stanford.edu/entries/ayn-rand/', 'Sections 1.3, 2.1–2.6 and 3.1'),
  S('acad-rand-epistemology', 'Badhwar & Long: Rand, Epistemology and Metaphysics', 'https://plato.stanford.edu/entries/ayn-rand/supplement.html', 'A.1–A.4; fallible judgments, concepts, contextual certainty and agency'),
  S('acad-stirner', 'David Leopold: Max Stirner', 'https://plato.stanford.edu/entries/max-stirner/', '2.2–2.4; ownness, fixed ideas, human essence, association'),
  S('acad-egoism', 'Robert Shaver: Egoism', 'https://plato.stanford.edu/entries/egoism/', '1–3; psychological, ethical and rational egoism'),
  S('acad-pragmatism', 'Legg & Hookway: Pragmatism', 'https://plato.stanford.edu/entries/pragmatism/', 'Pragmatic maxim; inquiry, truth and realism'),
  S('acad-promises', 'Michael R. James: Promises', 'https://plato.stanford.edu/entries/promises/', 'Normative powers, practice and expectation accounts; contract'),
  S('acad-obligation', 'Dagger & Lefkowitz: Political Obligation', 'https://plato.stanford.edu/entries/political-obligation/', 'Problem of political obligation; consent; philosophical anarchism'),
  S('acad-legitimacy', 'Fabienne Peter: Political Legitimacy', 'https://plato.stanford.edu/entries/legitimacy/', '2.1–2.3: authority, coercion and political obligation'),
  S('acad-rights', 'Leif Wenar: Rights', 'https://plato.stanford.edu/entries/rights/', 'Functions, forms and justification of rights'),
  S('acad-social-ontology', 'Brian Epstein: Social Ontology', 'https://plato.stanford.edu/entries/social-ontology/', 'Social dependence, group agents and methodological individualism'),
  S('acad-nominalism', 'Sam Cowling: Nominalism in Metaphysics', 'https://plato.stanford.edu/entries/nominalism-metaphysics/', 'Abstract objects and universals are distinct issues'),
  S('acad-epistemology', 'Stanford Encyclopedia of Philosophy: Epistemology', 'https://plato.stanford.edu/entries/epistemology/', 'Knowledge, justification, sources and foundational structure'),
  S('acad-contractarianism', 'Stanford Encyclopedia of Philosophy: Contractarianism', 'https://plato.stanford.edu/entries/contractarianism/', 'Mutual advantage contrasted with contractualist justification'),
  S('acad-constructivism', 'Carla Bagnoli: Constructivism in Metaethics', 'https://plato.stanford.edu/entries/constructivism-metaethics/', 'Objectivity, procedures and realism disputes'),
  S('acad-polzler-2018', 'Pölzler (2018): How to Measure Moral Realism', 'https://doi.org/10.1007/s13164-018-0401-8', 'Guidelines G1–G5; truth-aptness, universality, error theory and contamination', 'peer_reviewed_methodological_article'),
  S('acad-polzler-wright', 'Pölzler & Wright (2020): Anti-Realist Pluralism: A New Approach to Folk Metaethics', 'https://doi.org/10.1007/s13164-019-00447-8', 'Folk metaethical pluralism across judgments', 'peer_reviewed_research'),
  S('acad-marschall', 'Marschall (2021; online 2019): Easy Ontology, Quantification, and Realism', 'https://doi.org/10.1007/s11229-019-02463-8', 'Sections 1–2 and argument about the proposed compatibility with realism', 'peer_reviewed_philosophical_argument'),
  S('acad-thomasson', 'Amie L. Thomasson (2015): Ontology Made Easy', 'https://global.oup.com/academic/product/ontology-made-easy-9780190878665', 'Publisher description and contents only; not full-book access', 'academic_monograph', 'publisher_metadata_only'),
  S('acad-simmons', 'A. John Simmons (1999): Justification and Legitimacy', 'https://doi.org/10.1086/233944', 'Ethics 109(4), 739–771; supplement with the SEP accounts for substantive interpretation', 'peer_reviewed_philosophical_argument', 'publisher_metadata_only'),
  S('acad-ostrom', 'Elinor Ostrom (2010): Beyond Markets and States: Polycentric Governance of Complex Economic Systems', 'https://doi.org/10.1257/aer.100.3.641', 'AER 100(3), 641–672; polycentric governance is not a synonym for state abolition', 'peer_reviewed_institutional_research', 'publisher_metadata_only'),
  S('acad-hasnas', 'John Hasnas (2024): The Obviousness of Anarchy, in Common Law Liberalism', 'https://doi.org/10.1093/9780197784631.003.0009', 'Chapter 8, 264–294; practical argument for nonpolitical law, adjudication and protection', 'academic_monograph_chapter', 'publisher_abstract_reviewed'),
  S('acad-ous', 'Kahane et al. (2018): Beyond Sacrificial Harm: A Two-Dimensional Model of Utilitarian Psychology', 'https://pubmed.ncbi.nlm.nih.gov/29265854/', 'Impartial beneficence versus instrumental harm', 'instrument_development_research', 'abstract_reviewed'),
  S('acad-mfq2', 'Atari et al. (2023): Morality Beyond the WEIRD: How the Nomological Network of Morality Varies Across Cultures', 'https://pubmed.ncbi.nlm.nih.gov/37589704/', 'MFQ-2 development; six foundations', 'instrument_development_research', 'abstract_reviewed'),
  S('acad-fwi', 'Nadelhoffer et al. (2014): The Free Will Inventory', 'https://pubmed.ncbi.nlm.nih.gov/24561311/', 'Separate free-will, determinism and dualism beliefs', 'instrument_development_research', 'abstract_reviewed'),
  S('acad-clark-watson', 'Clark & Watson (2019): Constructing Validity: New Developments in Creating Objective Measuring Instruments', 'https://pubmed.ncbi.nlm.nih.gov/30896212/', 'Psychological Assessment 31, 1412–1427; DOI 10.1037/pas0000626', 'measurement_methodology', 'abstract_reviewed')
];

// [polarity, original item stem]. The three items are candidate indicators,
// not an assertion that a three-item latent scale has been established.
const C = (id, name, type, sourceIds, scope, doNotInfer, items) =>
  ({id, domainId: id.slice(0, 2), name, type, sourceIds, scope, doNotInfer, items});
export const additions = [
  C('ME09', 'Human-life grounding of moral standards', 'affinity', ['acad-rand','acad-egoism','acad-stirner'],
    'Whether requirements of human life and flourishing ground objective moral standards. Separate from mere biological description or current preferences.',
    ['moral realism entails a human-nature ethic','atheism entails objective egoism'], [
      [1, 'Facts about what human beings need to live and flourish can ground objective standards of good and bad action.'],
      [1, 'There can be a correct account of a good human life that does not change merely because a person wants something else.'],
      [-1, 'A description of human nature does not, by itself, give every individual a moral purpose they ought to fulfill.']]),
  C('ME10', 'Choice-to-live conditionality of moral reasons', 'affinity', ['acad-rand','acad-egoism'],
    'Whether moral requirements are conditional on choosing to live. This is not identical to making morality relative to any passing desire.',
    ['denying categorical reasons rules out Rand','hypothetical reasons imply cultural relativism'], [
      [1, 'The requirements of living well bind a person conditionally on that person choosing to live.'],
      [1, 'Choosing to continue living can make some actions objectively required, even when those actions conflict with current preferences.'],
      [-1, 'A person must preserve their life as a moral duty regardless of whether they choose life as an end.']]),
  C('NE15', 'Ethical egoism as a normative principle', 'affinity', ['acad-egoism','acad-rand'],
    'The universal moral prescription to prioritize one’s own good; not a claim about actual motives or a permission for personal projects.',
    ['self-priority permission entails ethical egoism','ethical egoism entails exploiting others'], [
      [1, 'Each person morally ought to treat their own long-term flourishing as the ultimate end of their actions.'],
      [1, 'Even when people choose different lives, morality should direct each of them toward their own good as their final aim.'],
      [-1, 'Concern for oneself can be permissible without being the ultimate moral standard that everyone ought to follow.']]),
  C('NE16', 'Rational egoism about practical reasons', 'affinity', ['acad-egoism'],
    'Whether one’s own welfare supplies the ultimate standard of practical rationality; distinct from moral rightness and descriptive motivation.',
    ['rational egoism equals psychological egoism'], [
      [1, 'What a person ultimately has most reason to do is whatever best promotes that person’s own long-term good.'],
      [1, 'If an action would genuinely make someone worse off overall, that person cannot have decisive practical reason to choose it.'],
      [-1, 'A person can have decisive reason to act for someone else’s sake even when their own life goes worse as a result.']]),
  C('NE17', 'Ownness and revisable allegiance to ideals', 'affinity', ['acad-stirner'],
    'Original operationalization of non-subjection to fixed ideals and revisable appropriation of projects. An interpretive proposal, not a validated Stirner scale.',
    ['ownness entails compulsive selfishness','ownness entails inability to love','ownness dictates a specific economic institution'], [
      [1, 'Even an ideal I value deeply should remain something I can reconsider, rather than an authority above me.'],
      [1, 'I can make a cause my own without accepting that I must serve it regardless of what I later come to value.'],
      [-1, 'Once I recognize an ideal as my true calling, serving it should take priority over whether I still make it my own.']]),
  C('NE18', 'Promissory self-binding', 'monopolar', ['acad-promises'],
    'Whether a voluntary promise itself creates a defeasible reason beyond current desire; not an exceptionless duty or legal remedy rule.',
    ['promissory reasons are always overriding','legal enforceability proves moral duty'], [
      [1, 'A freely made promise can give me a reason to act even after I no longer want to perform it.'],
      [1, 'Assume nobody has relied on a promise yet. The act of promising can still create a moral reason to keep it.'],
      [-1, 'Once my preferences change, the mere fact that I previously promised supplies no remaining moral reason to perform.']]),
  C('NE19', 'Continuing endorsement and exit from commitments', 'affinity', ['acad-stirner','acad-promises'],
    'Whether continued association or service requires renewed endorsement; separate from duties to repair induced reliance and from valid waiver.',
    ['exit entails no compensation','withdrawal entails endorsement of fraud'], [
      [1, 'Joining a voluntary association should not permanently surrender my ability to withdraw from it.'],
      [1, 'A past commitment alone cannot require me to keep serving a cause indefinitely after I reject its goals.'],
      [-1, 'A voluntary lifelong pledge can remove my moral permission to leave even if I later wholly reject its purpose.']]),
  C('NE20', 'Reliance-based reasons for performance or repair', 'monopolar', ['acad-promises'],
    'Reasons generated by induced expectations and reliance; separable from promises as normative powers and from specific-performance enforcement.',
    ['rejecting promise-based duties rejects reliance duties','repair requires compelled personal service'], [
      [1, 'If I intentionally lead someone to incur costs by relying on me, that reliance can give me a reason to make them whole.'],
      [1, 'Even without a formal promise, deliberately encouraging costly reliance can create responsibilities toward the person who relied.'],
      [-1, 'If I abandon a commitment, the costs I knowingly induced someone else to incur never give me a reason to repair their loss.']]),
  C('NE21', 'Elective other-regarding concern', 'affinity', ['acad-stirner','acad-egoism'],
    'Possibility of voluntarily caring about another as an end without making universal self-sacrifice a duty. Not the intensity of experienced affection.',
    ['rejection of obligatory altruism entails no affection','voluntary caring proves hidden self-interest'], [
      [1, 'I can choose to care about another person for their own sake without treating that concern as a duty owed to everyone.'],
      [1, 'Freely embracing a relationship can make another person’s good matter to me even without a moral command to sacrifice.'],
      [-1, 'Unless helping someone is a moral obligation, their welfare cannot be a genuine end of my action.']]),
  C('EP15', 'Fallibilism about knowledge', 'affinity', ['acad-epistemology','acad-pragmatism','acad-rand-epistemology'],
    'Whether knowledge can coexist with the possibility of error; distinct from willingness to revise, skepticism, and infallibility of a nonpropositional perceptual process.',
    ['fallible judgments disqualify Objectivism','fallibilism denies knowledge'], [
      [1, 'Someone can know a claim even though their justification does not eliminate every possibility of error.'],
      [1, 'The possibility that new evidence might overturn a conclusion does not automatically prevent it from counting as knowledge now.'],
      [-1, 'A claim counts as knowledge only if the possibility of being mistaken has been completely eliminated.']]),
  C('EP16', 'Pragmatic clarification through consequences', 'affinity', ['acad-pragmatism'],
    'Clarifying disputed ideas through conceivable differences in experience or conduct; not treating expediency as truth.',
    ['pragmatism entails relativism','pragmatism entails atheism'], [
      [1, 'To clarify a disputed idea, we should ask what difference accepting it would make to possible experience or action.'],
      [1, 'When two formulations have no conceivable difference in their consequences, that is a reason to question whether their disagreement is substantive.'],
      [-1, 'The meaning of a philosophical distinction can always be settled without considering any possible consequence for experience or conduct.']]),
  C('EP17', 'Concepts as revisable instruments of inquiry', 'affinity', ['acad-pragmatism','acad-rand-epistemology','acad-marschall'],
    'Conceptual revision and usefulness in inquiry; compatible with constraints from mind-independent reality.',
    ['human-made concepts entail arbitrary truth','revising definitions excludes Rand'], [
      [1, 'Concepts are instruments of inquiry whose usefulness can improve when we revise them.'],
      [1, 'A classification can be useful and answerable to reality even though people developed it for particular purposes.'],
      [-1, 'Once a concept is established, changing its boundaries necessarily makes our understanding less objective.']]),
  C('EP18', 'Noninferential foundations of justification', 'affinity', ['acad-epistemology','acad-rand-epistemology'],
    'Whether some epistemic warrant is not derived from other beliefs. Foundationalism need not make every foundation infallible.',
    ['foundationalism entails infallibility','anti-foundationalism equals pragmatism'], [
      [1, 'Some beliefs can have justification that does not come from inference from other beliefs.'],
      [1, 'An ordinary perceptual experience can provide initial warrant without first being supported by a further argument.'],
      [-1, 'Every justified belief must receive all of its justification from other beliefs.']]),
  C('EP19', 'Contextual certainty', 'affinity', ['acad-rand-epistemology','acad-epistemology'],
    'Whether sufficient evidence in a context can warrant certainty despite possible later revision. Not dogmatic immunity to evidence.',
    ['certainty necessarily means timeless immunity to correction'], [
      [1, 'Calling a conclusion certain can mean that all relevant evidence now available supports it, rather than that revision is forever impossible.'],
      [1, 'A later discovery need not show that earlier confidence was unreasonable given the evidence available at the time.'],
      [-1, 'A conclusion cannot ever have been warranted as certain if later evidence requires revising it.']]),
  C('EP20', 'Perceptual-conceptual basis of factual warrant', 'affinity', ['acad-rand-epistemology','acad-epistemology'],
    'Grounding claims about the concrete external world in sensory evidence integrated by reasoning; not a priori rationalism or rejecting scientific inference.',
    ['reason alone means a priori deduction','indirect inference lacks sensory grounding'], [
      [1, 'Knowledge about concrete reality ultimately requires evidence from experience organized and assessed through reasoning.'],
      [1, 'Even highly abstract factual claims need a defensible connection to what can be observed.'],
      [-1, 'Pure reasoning can establish new facts about concrete external reality without any ultimate dependence on experience.']]),
  C('OM11', 'Abstract-object commitment', 'categorical', ['acad-nominalism','acad-marschall'],
    'Existence of abstract objects such as numbers, distinct from realism about universals and ordinary physical objects.',
    ['abstract objects equal universals','abstract-object denial entails denial of tables'], [
      [1, 'At least some numbers exist as abstract objects rather than merely as written marks or mental images.'],
      [1, 'There can be objects that are neither located in space nor able to cause physical events.'],
      [-1, 'Only concrete things exist; apparent reference to abstract objects need not commit us to their existence.']]),
  C('OM12', 'Universals commitment', 'categorical', ['acad-nominalism','acad-rand-epistemology'],
    'Whether numerically the same universal is instantiated by distinct things; separate from shared resemblance and mental concepts.',
    ['rejecting universals denies objective resemblance','concept theory settles all abstract ontology'], [
      [1, 'Two distinct red objects can instantiate one and the same universal redness.'],
      [1, 'What explains shared properties is sometimes a single repeatable entity present in many different things.'],
      [-1, 'Distinct things can resemble one another without sharing a numerically identical universal.']]),
  C('OM13', 'Ordinary external-world independence', 'monopolar', ['acad-rand-epistemology','acad-epistemology'],
    'Independence of ordinary concrete objects from thought; does not settle social ontology, universals, or the method of ontology.',
    ['world realism entails abstract realism','social construction entails idealism'], [
      [1, 'Mountains and stones can exist independently of anyone thinking about them.'],
      [1, 'Changing everybody’s beliefs about an unobserved physical object would not by itself change that object’s physical properties.'],
      [-1, 'Ordinary physical objects depend for their existence on being thought about or experienced by a mind.']]),
  C('OM14', 'Easy or deflationary approach to ontology', 'affinity', ['acad-marschall','acad-thomasson'],
    'Using conceptual application conditions and ordinary empirical inquiry rather than an additional heavyweight existence test. Compatibility with realism remains disputed.',
    ['easy ontology entails nominalism','deflationary method denies existence'], [
      [1, 'Some existence questions can be answered using a concept’s ordinary application rules together with relevant empirical facts.'],
      [1, 'After ordinary criteria for saying something exists are satisfied, a further philosophical test of whether it really exists may add nothing.'],
      [-1, 'Even when ordinary conceptual and empirical criteria are met, a separate deep metaphysical test is always required to establish existence.']]),
  C('SO14', 'Institutional dependence without elimination', 'affinity', ['acad-social-ontology'],
    'Whether institution-dependent entities can be real; different from independence from all persons or a moral collective duty.',
    ['social dependence entails fiction','social entities entail moral collectivism'], [
      [1, 'Money can be real even though its monetary status depends on human practices.'],
      [1, 'An institution can have genuine effects without existing independently of all the people and practices that sustain it.'],
      [-1, 'If an institution depends on human practices for its existence, it cannot be a real part of the world.']]),
  C('SO15', 'Individual-level explanation of social processes', 'affinity', ['acad-social-ontology'],
    'Whether social explanations must be grounded in agents and their interactions; not normative individualism or denial of aggregate patterns.',
    ['methodological individualism entails selfishness','group agency entails collectivist morality'], [
      [1, 'An explanation of an institution should show how people’s actions and interactions sustain it.'],
      [1, 'Saying that a society wanted something leaves an explanation incomplete unless we identify the relevant agents and processes.'],
      [-1, 'Social institutions can be fully explained without any account of the people or interactions through which they operate.']]),
  C('PL27', 'Preinstitutional grounding of rights', 'affinity', ['acad-rights','acad-rand'],
    'Whether persons have basic rights independently of social recognition; distinct from the form and strength of a particular property regime.',
    ['strong rights entail one unique moral foundation','natural rights entail a state'], [
      [1, 'People can possess basic moral rights before any government or community recognizes those rights.'],
      [1, 'An institution can violate a person’s rights even when every applicable legal rule authorizes its action.'],
      [-1, 'All rights derive entirely from established social rules rather than any claim persons have before those rules.']]),
  C('PL28', 'Institutional and instrumental justification of rights', 'affinity', ['acad-rights','acad-contractarianism'],
    'Justification of rights in terms of agency, cooperation or institutional consequences. May coexist with status-based justification.',
    ['instrumental justification entails weak rights','instrumental rights entail utilitarianism'], [
      [1, 'Part of the justification for protecting rights can be what stable rights make possible for human agency and cooperation.'],
      [1, 'Evaluating alternative rights arrangements can legitimately involve comparing how the resulting institutions work.'],
      [-1, 'How a rights arrangement affects people’s lives and cooperation is never relevant to its justification.']]),
  C('PL29', 'Territorial monopoly of final legal force', 'affinity', ['acad-rand','acad-legitimacy','acad-hasnas'],
    'Whether a single final rights-protecting legal authority is necessary within a territory. Separate from arbitrary command and unqualified obedience.',
    ['rights protection entails general duty to obey all laws','philosophical anarchism entails rejecting courts'], [
      [1, 'Protecting rights requires one institution with final legal authority over the use of force within a territory.'],
      [1, 'Competing agencies must ultimately be subject to a single public legal authority rather than each claiming final enforcement power.'],
      [-1, 'There need not be a single territorial institution with final authority over all legitimate protective force.']]),
  C('PL30', 'Nonstate adjudication and protective provision', 'affinity', ['acad-hasnas','acad-legitimacy'],
    'Institutional possibility and acceptability of nonstate legal services; separate from rejection of general political obligation and from assuming all commons require markets.',
    ['polycentricity entails total state abolition','nonstate provision proves all practical cases succeed'], [
      [1, 'Courts and protective services could in principle be provided by competing nonstate institutions under shared rules.'],
      [1, 'Providing adjudication or protection need not give one organization an exclusive territorial right to provide that service.'],
      [-1, 'Even well-coordinated nonstate institutions cannot legitimately provide final adjudication and protective enforcement.']]),
  C('PL31', 'Institutional value independent of obedience', 'affinity', ['acad-obligation','acad-legitimacy','acad-simmons'],
    'Practical justification and participation without conceding a general content-independent moral duty. Not a disguised abolition scale.',
    ['no general obedience implies no useful public institutions'], [
      [1, 'A government can provide valuable services without that fact creating a general moral duty to obey its laws.'],
      [1, 'Using courts or voting can be sensible even for someone who denies that legal commands create moral duties merely by being law.'],
      [-1, 'Anyone who denies a general duty to obey the law must also regard every government institution as useless.']]),
  C('PL32', 'Institutional state-abolition preference', 'affinity', ['acad-obligation','acad-legitimacy','acad-hasnas'],
    'Preference for replacing states, independent of rejecting general obligation. This does not measure timing or methods of transition.',
    ['philosophical anarchism entails immediate abolition','abolition entails violent methods'], [
      [1, 'Even a relatively decent state should ultimately be replaced by institutions without state authority.'],
      [1, 'My preferred institutional endpoint has no organization possessing the authority of a state.'],
      [-1, 'A suitably constrained state may be worth retaining even if no general duty to obey it can be established.']]),
  C('PL33', 'Contractual remedies distinct from continuing assent', 'affinity', ['acad-promises'],
    'Justification of compensatory or protective remedies despite withdrawal, distinct from compulsory personal performance or legal advice about existing law.',
    ['withdrawal permission rules out remedies','enforceability proves moral promise theories'], [
      [1, 'Someone may be free to stop performing a personal commitment while still owing compensation for losses they knowingly induced.'],
      [1, 'A rule requiring repair after breaking an agreement need not require forcing the person to perform the promised personal service.'],
      [-1, 'Once a person withdraws assent from an agreement, any claim for compensation necessarily becomes illegitimate.']]),
  C('AH13', 'Psychological egoism', 'monopolar', ['acad-egoism','acad-stirner'],
    'Descriptive universal claim that ultimate motives concern one’s own welfare. Distinguish desire ownership from desire content.',
    ['acting on my desires means desiring only my own welfare'], [
      [1, 'Every intentional action is ultimately motivated by the actor’s own welfare, even when the action appears generous.'],
      [1, 'When someone helps another for no reward, their ultimate aim is still always some benefit to themselves.'],
      [-1, 'Someone can ultimately desire another person’s good rather than only the benefits that helping brings to themselves.']]),
  C('AH14', 'Incompatibilist condition on free agency', 'categorical', ['acad-fwi','acad-rand-epistemology'],
    'Whether causal determinism excludes free agency, distinct from the belief that determinism is true or ordinary freedom from coercion.',
    ['free will and determinism are opposite sliders','uncaused randomness alone establishes agency'], [
      [1, 'If the entire prior state of the world fixed a choice, that choice could not be genuinely free.'],
      [1, 'Genuine freedom requires that the person could choose differently with exactly the same complete prior conditions.'],
      [-1, 'A choice can be genuinely free even if it was determined, provided it issued appropriately from the person’s own reasoning and capacities.']])
];

export const antiInferences = [
  ['EP15','EP19','Fallible propositional judgments and contextual certainty need not exclude one another.'],
  ['EP18','EP15','Foundational warrant does not entail infallibility.'],
  ['EP17','OM13','Revisable human concepts do not entail a mind-dependent physical world.'],
  ['EP05','EP20','A priori rationalism is not the same as reasoning from sensory evidence.'],
  ['OM11','OM12','Abstract objects and universals require separate evidence.'],
  ['OM14','OM11','Easy ontology is not automatically abstract-object nominalism.'],
  ['OM14','OM13','A deflationary method is not automatically external-world anti-realism.'],
  ['SO14','SO02','Institution-dependent reality does not imply normative collectivism.'],
  ['SO15','SO01','Individual-level explanation is not a moral priority rule.'],
  ['AH13','NE15','Psychological and ethical egoism must not proxy for one another.'],
  ['NE16','NE15','Practical rationality and moral rightness are distinct normative questions.'],
  ['NE17','NE15','Ownness is not an obligation to maximize self-interest.'],
  ['NE17','NE21','Ownness need not exclude elective concern for others.'],
  ['ME05','ME10','Rejecting categorical reasons does not by itself reject objective life-conditional ethics.'],
  ['NE18','NE19','Promissory reasons and exit conditions are not an all-or-nothing opposition.'],
  ['NE19','NE20','Withdrawal can coexist with reliance-based repair responsibilities.'],
  ['NE18','PL33','Promise morality and contractual enforceability require separate questions.'],
  ['PL27','PL11','Strong property protection does not uniquely identify a natural-rights foundation.'],
  ['PL27','PL28','Status and instrumental justifications can coexist.'],
  ['PL02','PL31','No general obedience duty does not entail useless government.'],
  ['PL02','PL32','Philosophical anarchism does not by itself prescribe state abolition.'],
  ['PL24','PL30','Polycentric governance is not synonymous with nonstate market law.'],
  ['PL01','PL29','Permission to coerce in a case does not entail exclusive territorial authority.'],
  ['AH01','AH14','Ordinary agency and a condition excluding determinism are different claims.']
];
