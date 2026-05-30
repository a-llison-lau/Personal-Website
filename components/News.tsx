import ExtLink from "./ExtLink";

const News = (): JSX.Element => {
  return (
    <section className="grid mt-8" id="news">
      <h1 className="text-2xl font-bold text-left mb-4">News</h1>
      <div className="text-base ml-4 mb-8">
        <ul className="list-disc">
          {
            <li>
              <strong>26' May</strong>:: Our abstract From Detection to Severity
              Ranking on the Alcohol Language Corpus is accepted to the UK and
              Ireland Speech Workshop 2026! I will presenting our work at
              Vocadian on June 22-23 in London!
            </li>
          }
          {
            <li>
              <strong>26' May</strong>:: Our paper Memory Over Maps is accepted
              to the MM-SpatialAI Workshop at ICRA 2026 as an oral!
            </li>
          }
          {
            <li>
              <strong>25' Sep</strong>:: I started my master's at ETH Zurich!
            </li>
          }
          {
            <li>
              <strong>24' Dec</strong>:: I am in Vancouver for NeurIPS! I'll be
              presenting a poster on Dec 14 (Sat) at 4:30-5:30pm:{" "}
              <ExtLink href="https://adaptive-foundation-models.org/posters/PPT_AFM_2024_Poster.pdf">
                Personalized Adaptation via In-Context Preference Learning{" "}
              </ExtLink>{" "}
              @{" "}
              <ExtLink href="https://adaptive-foundation-models.org/index.html">
                AFM{" "}
              </ExtLink>
            </li>
          }
        </ul>
      </div>
    </section>
  );
};

export default News;
