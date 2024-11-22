import ExtLink from './ExtLink';

interface Props {
    publication: any;
    index: number;
}

const PublicationItem = ({publication, index}: Props): JSX.Element => {
    return (
        <div className = "mt-4 mb-8">
            <p className = "text-base text-gray-500">
                [{index}] <b><i>{publication.title}</i></b> 
                <br/>
                {publication.author}
                <br/>
                <b>{publication.conference}</b>
                <br/>
                <span className="text-gray-400">{publication.abstract}</span>
            </p>
            <p className = "text-gray-500 flex justify-end text-sm bold">
                {publication.links.map((linkItem: any, idx: any) => (
                    <ExtLink href={linkItem.url} key={idx}> [{linkItem.name}] &nbsp;</ExtLink>
                ))}                
            </p>
            
        </div>

    );
};

export default PublicationItem;
