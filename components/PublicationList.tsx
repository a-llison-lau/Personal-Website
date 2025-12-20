import PublicationItem from './PublicationItem'
import data from './data/work.json'

const PublicationList = (): JSX.Element => {
    return (
        <section className="grid w-full" id="work">
            <h1 className="text-2xl font-bold text-left mb-4">Professional Work</h1>
            <div>
              {data.map((publication, index) => (
                <PublicationItem publication={publication} index={index} key={index}/>
              ))}
            </div>

        </section>
    );
};



export default PublicationList;
