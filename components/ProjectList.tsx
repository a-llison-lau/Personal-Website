import ProjectItem from "./ProjectItem";
import data from "./data/projects.json";

const ProjectList = (): JSX.Element => {
  return (
    <section className="container mx-auto px-4" id="publications">
      <h1 className="text-2xl font-bold mt-12 mb-4">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((project, index) => (
          <ProjectItem key={index} project={project} index={index} />
        ))}
      </div>
    </section>
  );
};

export default ProjectList;
