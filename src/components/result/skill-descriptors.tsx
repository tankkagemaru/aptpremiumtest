/** CEFR skill descriptors (page 2 of the report), after the CEFR framework. */

type Row = { level: string; text: string };

const LISTENING: Row[] = [
  { level: "A0", text: "Not enough to allow for any meaningful inferences about the candidate's ability." },
  { level: "A1", text: "Can follow speech which is very slow and carefully articulated, with long pauses to assimilate meaning." },
  { level: "A2", text: "Can understand enough to meet needs of a concrete type provided speech is clearly and slowly articulated." },
  { level: "B1", text: "Can understand straightforward factual information about common everyday or job-related topics, identifying both general messages and specific details, provided speech is clearly articulated in a generally familiar accent." },
  { level: "B2", text: "Can understand the main ideas of propositionally and linguistically complex speech on both concrete and abstract topics delivered in a standard dialect, including technical discussions in his/her field of specialisation." },
  { level: "C", text: "Has no difficulty in understanding any kind of spoken language, whether live or broadcast, delivered at fast native speed." },
];

const READING: Row[] = [
  { level: "A0", text: "Not enough to allow for any meaningful inferences about the candidate's ability." },
  { level: "A1", text: "Can understand very short, simple texts a single phrase at a time, picking up familiar names, words and basic phrases and rereading as required." },
  { level: "A2", text: "Can understand short, simple texts on familiar matters of a concrete type which consist of high-frequency everyday or job-related language." },
  { level: "B1", text: "Can read straightforward factual texts on subjects related to his/her field and interest with a satisfactory level of comprehension." },
  { level: "B2", text: "Can read with a large degree of independence, adapting style and speed of reading to different texts and purposes, and using appropriate reference sources selectively." },
  { level: "C", text: "Can understand and interpret critically virtually all forms of the written language." },
];

const SPEAKING: Row[] = [
  { level: "A0", text: "Not enough to allow for any meaningful inferences about the candidate's ability." },
  { level: "A1", text: "Can produce simple descriptions on mainly personal topics." },
  { level: "A2", text: "Can give a simple description or presentation of people, living or working conditions, daily routines, likes/dislikes, etc. as a short series of simple phrases and sentences linked into a list." },
  { level: "B1", text: "Can reasonably fluently sustain a straightforward description of one of a variety of subjects within his/her field of interest, presenting it as a linear sequence of points." },
  { level: "B2", text: "Can give clear, systematically developed descriptions and presentations on a wide range of subjects, highlighting significant points and relevant supporting detail." },
  { level: "C", text: "Can produce clear, smoothly flowing well-structured speech with an effective logical structure which helps the recipient to notice and remember significant points." },
];

const WRITING: Row[] = [
  { level: "A0", text: "Not enough to allow for any meaningful inferences about the candidate's ability." },
  { level: "A1", text: "Can write simple isolated phrases and sentences." },
  { level: "A2", text: "Can write a series of simple phrases and sentences linked with simple connectors like 'and', 'but' and 'because'." },
  { level: "B1", text: "Can write straightforward connected texts on a range of familiar subjects within his/her field of interest, by linking a series of shorter discrete elements into a linear sequence." },
  { level: "B2", text: "Can write clear, detailed texts on a variety of subjects related to his/her field of interest and shows an ability to use different registers within written texts." },
  { level: "C", text: "Can write clear, smoothly flowing, complex texts in an appropriate and effective style and a logical structure which helps the reader to find significant points." },
];

function Block({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="mb-5 print-avoid-break">
      <p className="font-display text-lg text-crimson mb-1">{title}</p>
      <table className="w-full text-[12px]">
        <tbody>
          {rows.map((r) => (
            <tr key={r.level} className="border-b border-line align-top">
              <td className="py-1.5 pr-3 font-medium w-8">{r.level}</td>
              <td className="py-1.5 leading-5">{r.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkillDescriptors() {
  return (
    <div>
      <p className="font-display text-2xl mb-4">CEFR skill descriptors</p>
      <Block title="Listening" rows={LISTENING} />
      <Block title="Reading" rows={READING} />
      <Block title="Speaking" rows={SPEAKING} />
      <Block title="Writing" rows={WRITING} />
    </div>
  );
}
