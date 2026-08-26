import myMovie from '../api/my_series.json';
import '../app.css';

function Movie() {
    return <>
        {myMovie.map(function (curElem) {
            return (
                <div key={curElem.id} classname="card">
                    <h2>Name:{curElem.name}</h2>
                    <img src={curElem.img_url} width="500px" />
                    <h2>Rating:{curElem.rating}</h2>
                    <h3>Cast:{curElem.cast}</h3>
                    <p>Description:{curElem.description}</p>
                    <p> Genre:{curElem.genre}</p>
                    <a href={curElem.watch_url}>
                        <button>Watch Now</button>
                    </a>

                </div>


            );
        })}
    </>
};

export default Movie;


