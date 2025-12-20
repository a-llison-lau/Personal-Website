import ProjectSectionItem from './ProjectSectionItem';
import data from './data/projects.json';

const Projects = (): JSX.Element => {
    return (
        <section className="grid w-full mt-8" id="projects">
            <h1 className="text-2xl font-bold text-left mb-4">Projects</h1>
            <div>
                {data.map((project, index) => (
                    <ProjectSectionItem project={project} key={index} />
                ))}
            </div>
        </section>
    );
};

export default Projects;
