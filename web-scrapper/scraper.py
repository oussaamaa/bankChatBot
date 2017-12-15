from bs4 import BeautifulSoup
import requests
from firebase import firebase
import hashlib


firebase = firebase.FirebaseApplication('https://krazybits-cfc64.firebaseio.com/', None)


def scrapUrlDefence():

    tn_page = 'http://www.defense.tn/index.php/ar/recrutementar'
    r = requests.get(tn_page)
    page = r.text
    soup = BeautifulSoup(page, 'html.parser')

    list_offres = soup.find_all('h3', attrs={'class': 'catItemTitle'})
    data_set = []
    for n in list_offres:
        data = {
            'url': n.a['href'],
            'title': n.a.string
        }
        data_set.append(data)
    cleaned_data = {
        'offres': data_set
    }
    print(cleaned_data)
    firebase.patch('/data-tn/defence/', cleaned_data)

def scrapEmploiTn():

    tn_page = "http://www.emploi.rn.tn/%D8%A7%D9%84%D9%85%D9%86%D8%A7%D8%B8%D8%B1%D8%A7%D8%AA.html"
    r = requests.get(tn_page)
    page = r.text
    soup = BeautifulSoup(page, 'html.parser')
    list_offres = soup.find_all('h2', attrs={'itemprop': 'name'})
    #images = soup.find_all('img', attrs={'class': 's5_lazyload'})
    data_set = []
    for n in list_offres:
        data = {
            'url': n.a['href'],
            'title': n.a.string,
            'image': 'http://www.emploi.rn.tn/images/emploi/2017/12/07/1511807577_article_94568.jpg'
        }
        data_set.append(data)
    cleaned_data = {
        'offres': data_set
    }
    print(cleaned_data)
    firebase.patch('/data-tn/offres-tn/', cleaned_data)


while True:
    scrapUrlDefence()
    scrapEmploiTn()
