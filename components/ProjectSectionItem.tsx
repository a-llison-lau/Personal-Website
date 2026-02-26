import ExtLink from './ExtLink';
import Link from 'next/link';

interface Props {
    project: {
        title: string;
        description: string;
        img: string;
        date?: string;
        tags?: string[];
        github?: string;
        "project link"?: string;
    };
}

const ProjectSectionItem = ({ project }: Props): JSX.Element => {
    const projectLink = project["project link"];
    const isInternalProjectLink = Boolean(projectLink?.startsWith('/'));

    return (
        <div className="mt-4 mb-8 flex items-start">
            {/* Picture Section (Hidden on mobile, 30% width on larger screens) - LEFT SIDE */}
            {project.img && (
                <div className="hidden sm:block w-[30%] flex-shrink-0 pr-4">
                    <img
                        src={project.img}
                        alt={`${project.title} thumbnail`}
                        className="w-full h-auto object-cover rounded"
                    />
                </div>
            )}

            {/* Text Section - RIGHT SIDE */}
            <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{project.title}</h3>
                <p className="text-base">
                    {project.description}
                </p>

                {/* Links */}
                {(project.github || project["project link"]) && (
                    <p className="flex flex-wrap mt-2 text-sm font-bold">
                        {project.github && (
                            <ExtLink href={project.github}>
                                [github]&nbsp;
                            </ExtLink>
                        )}
                        {projectLink && (
                            isInternalProjectLink ? (
                                <Link
                                    href={projectLink}
                                    className="border-b-[1px] border-gray-600 transition hover:bg-amber-200 dark:hover:bg-gray-600 rounded-t-sm">
                                    [blog]&nbsp;
                                </Link>
                            ) : (
                                <ExtLink href={projectLink}>
                                    [blog]&nbsp;
                                </ExtLink>
                            )
                        )}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProjectSectionItem;
