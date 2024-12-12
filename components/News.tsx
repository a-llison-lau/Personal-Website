import ExtLink from './ExtLink';

const News = (): JSX.Element => {
    return (
        <section className="grid" id="news">
            <h2 className="text-xl font-bold mt-12 mb-4">News</h2>
            <div className="text-base ml-4 text-gray-700">
                <ul className="list-disc">
                  {
                    <li>
                        <strong>Dec 10</strong>:: I am in Vancouver for NeurIPS! I'll be presenting a poster on Dec 14 (Sat) at 4:30-5:30pm: <ExtLink href= "https://adaptive-foundation-models.org/posters/PPT_AFM_2024_Poster.pdf">Personalized Adaptation via In-Context Preference Learning </ExtLink> @ <ExtLink href= "https://adaptive-foundation-models.org/index.html">AFM </ExtLink>
                    </li>
                  }
                </ul>
            </div>

        </section>
    );
};



export default News;
