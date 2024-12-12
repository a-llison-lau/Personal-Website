const Teaching = (): JSX.Element => {
    return (
        <section className="grid" id="teaching">
            <h2 className="text-xl font-bold mt-12 mb-4">Teaching</h2>
            <div className="text-base ml-4 text-gray-700">
                <ul className="list-disc">
                  {
                    <li>
                        Dec 12: I am in Vancouver for NeurIPS! I'll be presenting at the Adaptive Foundation Models Workshop on Dec 14 (Sat) at 4:30-5:30pm: Personalized Adaption via In-Context Preference Learning
                        <a href="https://adaptive-foundation-models.org/posters/PPT_AFM_2024_Poster.pdf">
                        Personalized Adaption via In-Context Preference Learning
                      </a>
                    </li>
                  }
                </ul>
            </div>

        </section>
    );
};



export default Teaching;
