import ExtLink from './ExtLink';

interface Props {
    publication: any; // Dynamic typing for flexibility
    index: number;
}

const PublicationItem = ({ publication, index }: Props): JSX.Element => {
    return (
        <div className="mt-4 mb-8 flex items-start">
            {/* Text Section */}
            <div className="flex-1 pr-4">
                <p className="text-base text-gray-500">
                    [{index}] <b><i>{publication.title}</i></b>
                    <br />
                    {publication.author}
                    <br />
                    <b>{publication.conference}</b>
                    <br />
                    <span className="text-gray-400">{publication.abstract || 'No abstract available.'}</span>
                </p>

                {/* Links (Left-aligned) */}
                {publication.links?.length > 0 && (
                    <p className="text-gray-500 flex flex-wrap mt-2 text-sm font-bold">
                        {publication.links.map((linkItem: any, idx: number) => (
                            <ExtLink href={linkItem.url} key={idx}>
                                [{linkItem.name}]&nbsp;
                            </ExtLink>
                        ))}
                    </p>
                )}
            </div>

            {/* Picture Section (Hidden on mobile, 20% width on larger screens) */}
            {publication.picture && (
                <div className="hidden sm:block w-[30%] flex-shrink-0">
                    <img
                        src={publication.picture}
                        alt={`${publication.title} thumbnail`}
                        className="w-full h-auto object-cover rounded"
                    />
                </div>
            )}
        </div>
    );
};

export default PublicationItem;
